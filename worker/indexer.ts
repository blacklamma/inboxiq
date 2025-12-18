import crypto from "crypto";
import { google } from "googleapis";
import { htmlToText } from "html-to-text";
import OpenAI from "openai";
import { IndexJobStatus } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { decryptToken } from "../src/lib/crypto";

const POLL_INTERVAL_MS = 2000;
const EMBEDDING_MODEL = "text-embedding-3-small";
const CLASSIFIER_MODEL = "gpt-4o-mini";
const MAX_BODY_CHARS = 2000;
const CATEGORIES = [
  "Work",
  "Personal",
  "Receipts",
  "Meetings",
  "Shipping",
  "Notifications",
  "Praise/Positive",
  "Action Required",
];

const tagCache = new Map<string, string>();
const openai =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeBase64Url(data: string) {
  return Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf8");
}

function getHeader(
  headers: { name?: string | null; value?: string | null }[] = [],
  name: string
) {
  return (
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    null
  );
}

type GmailPayload = {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: GmailPayload[] | null;
  headers?: { name?: string | null; value?: string | null }[];
};

function extractBody(payload: GmailPayload | null | undefined): {
  text?: string;
  html?: string;
} {
  if (!payload) return {};

  const parts: { type: "text" | "html"; data: string }[] = [];
  const stack: (GmailPayload | null | undefined)[] = [payload];

  while (stack.length) {
    const part = stack.pop() ?? null;
    if (part?.parts?.length) {
      stack.push(...part.parts);
    }
    if (part?.mimeType?.toLowerCase() === "text/plain" && part.body?.data) {
      parts.push({ type: "text", data: part.body.data });
    } else if (
      part?.mimeType?.toLowerCase() === "text/html" &&
      part.body?.data
    ) {
      parts.push({ type: "html", data: part.body.data });
    } else if (!part?.parts && part?.body?.data && !part.mimeType) {
      parts.push({ type: "text", data: part.body.data });
    }
  }

  const text = parts.find((p) => p.type === "text")?.data;
  const html = parts.find((p) => p.type === "html")?.data;

  return {
    text: text ? decodeBase64Url(text) : undefined,
    html: html ? decodeBase64Url(html) : undefined,
  };
}

function cleanText(raw: string) {
  const lines = raw.split("\n");
  const cleaned: string[] = [];
  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.startsWith(">")) continue;
    if (/^on .+wrote:$/i.test(trimmed)) break;
    if (/^-+original message-+$/i.test(trimmed)) break;
    cleaned.push(trimmed);
  }
  return cleaned.join("\n").trim();
}

function hashContent(subject: string | null, body: string | null) {
  return crypto
    .createHash("sha256")
    .update(`${subject ?? ""}|${body ?? ""}`)
    .digest("hex");
}

async function claimQueuedJob() {
  const job = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "IndexJob"
      WHERE "status" = 'QUEUED'
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (!rows.length) return null;

    const claimed = await tx.indexJob.update({
      where: { id: rows[0].id },
      data: {
        status: IndexJobStatus.RUNNING,
        startedAt: new Date(),
        lastError: null,
      },
    });

    return claimed;
  });

  return job;
}

async function getGmailClient(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }

  const oauth2Client = new google.auth.OAuth2({
    clientId,
    clientSecret,
  });
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  await oauth2Client.getAccessToken();
  return google.gmail({ version: "v1", auth: oauth2Client });
}

async function ingestMessages(job: {
  id: string;
  userId: string;
  total: number;
}) {
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_provider: { userId: job.userId, provider: "google" } },
  });

  if (!account?.encryptedRefreshToken) {
    throw new Error("No Gmail refresh token stored for user");
  }

  const refreshToken = decryptToken(account.encryptedRefreshToken);
  const gmail = await getGmailClient(refreshToken);

  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults: job.total,
  });

  const messages = listRes.data.messages ?? [];
  let processed = 0;

  for (const m of messages) {
    if (!m.id) continue;
    try {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: m.id,
        format: "full",
      });

      const payload = full.data.payload;
      const headers = payload?.headers ?? [];
      const subject = getHeader(headers, "Subject");
      const from = getHeader(headers, "From");
      const to = getHeader(headers, "To");
      const dateStr = getHeader(headers, "Date");
      // Message-ID captured for completeness (not yet stored)
      getHeader(headers, "Message-ID");
      const threadId = full.data.threadId ?? null;
      const snippet = full.data.snippet ?? "";

      const { text, html } = extractBody(payload);
      const bodyText = text ?? (html ? htmlToText(html) : "");
      const cleanedText = cleanText(bodyText ?? "");
      const rawHash = hashContent(subject, cleanedText);

      const date = dateStr ? new Date(dateStr) : null;

      const stored = await prisma.emailMessage.upsert({
        where: { gmailId: m.id },
        update: {
          threadId,
          from,
          to,
          subject,
          date: date ?? undefined,
          snippet,
          cleanedText,
          rawHash,
        },
        create: {
          gmailId: m.id,
          threadId,
          from,
          to,
          subject,
          date: date ?? undefined,
          snippet,
          cleanedText,
          rawHash,
          userId: job.userId,
          createdAt: new Date(),
        },
      });

      await Promise.all([
        maybeStoreEmbedding(stored.id, subject, cleanedText),
        categorizeAndTagEmail(stored.id, subject, cleanedText, from),
      ]);
    } catch (err) {
      // Log and continue to next message
      console.error("Failed to ingest message", m.id, err);
    } finally {
      processed += 1;
      await prisma.indexJob.update({
        where: { id: job.id },
        data: { processed },
      });
    }
  }

  await prisma.indexJob.update({
    where: { id: job.id },
    data: {
      status: IndexJobStatus.COMPLETED,
      finishedAt: new Date(),
      processed,
    },
  });
}

async function maybeStoreEmbedding(
  emailMessageId: string,
  subject: string | null,
  cleanedText: string | null
) {
  if (!openai) return;
  const input =
    `${subject ?? ""}\n\n${(cleanedText ?? "").slice(0, MAX_BODY_CHARS)}`.trim();
  if (!input) return;

  const embeddingRes = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });

  const vector = embeddingRes.data[0]?.embedding;
  if (!vector) return;

  const vectorLiteral = `[${vector.join(",")}]`;
  await prisma.$executeRaw`
    INSERT INTO "Embedding" ("emailMessageId", "vector")
    VALUES (${emailMessageId}, ${vectorLiteral}::vector)
    ON CONFLICT ("emailMessageId") DO UPDATE SET "vector" = EXCLUDED."vector";
  `;
}

function heuristicTags(
  subject: string | null,
  body: string | null,
  from: string | null
) {
  const text = `${subject ?? ""} ${body ?? ""}`.toLowerCase();
  const fromDomain = from?.split("@")[1]?.toLowerCase() ?? "";
  const tags = new Set<string>();

  const contains = (words: string[]) => words.some((w) => text.includes(w));

  if (
    contains([
      "invoice",
      "receipt",
      "payment",
      "order",
      "statement",
      "billed",
    ]) ||
    /amazon\.|paypal\.|stripe|ubereats|doordash|instacart/.test(fromDomain)
  ) {
    tags.add("Receipts");
  }

  if (
    contains([
      "shipped",
      "shipping",
      "delivery",
      "tracking",
      "package",
      "out for delivery",
    ])
  ) {
    tags.add("Shipping");
  }

  if (
    contains([
      "meeting",
      "calendar",
      "invite",
      "event",
      "zoom",
      "webex",
      "teams",
    ]) ||
    text.includes("scheduled")
  ) {
    tags.add("Meetings");
  }

  if (contains(["alert", "notification", "digest", "summary"])) {
    tags.add("Notifications");
  }

  if (
    contains([
      "action required",
      "please respond",
      "urgent",
      "reply needed",
      "requires your attention",
      "due",
    ])
  ) {
    tags.add("Action Required");
  }

  if (
    contains([
      "thanks",
      "thank you",
      "appreciate",
      "great job",
      "well done",
      "congrats",
    ])
  ) {
    tags.add("Praise/Positive");
  }

  const freemail = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
  ];
  if (fromDomain) {
    if (!freemail.includes(fromDomain)) {
      tags.add("Work");
    } else {
      tags.add("Personal");
    }
  }

  const confidence = tags.size > 0 ? 0.8 : 0.2;
  return { tags: Array.from(tags), confidence };
}

async function llmTags(subject: string | null, body: string | null) {
  if (!openai) return [];
  const prompt = `
You are an email classifier. Choose zero or more categories from:
${CATEGORIES.join(", ")}.

Email subject: ${subject ?? "(none)"}
Body preview: ${(body ?? "").slice(0, 1000)}

Respond ONLY with a JSON object: {"tags":["..."]}.`;

  const res = await openai.chat.completions.create({
    model: CLASSIFIER_MODEL,
    messages: [
      { role: "system", content: "Classify emails into provided categories." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  const content = res.choices[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.tags)) {
      return parsed.tags
        .map((t: unknown) => String(t).trim())
        .filter((t: string) => CATEGORIES.includes(t));
    }
  } catch (err) {
    console.error("Failed to parse LLM tags", err, content);
  }
  return [];
}

async function categorizeAndTagEmail(
  emailMessageId: string,
  subject: string | null,
  cleanedText: string | null,
  from: string | null
) {
  const heuristic = heuristicTags(subject, cleanedText, from);
  let tags = heuristic.tags;

  if (tags.length === 0) {
    const llm = await llmTags(subject, cleanedText);
    tags = llm;
  }

  if (tags.length === 0) return;

  const tagIds = await ensureTags(tags);

  await prisma.emailMessageTag.deleteMany({ where: { emailMessageId } });

  await prisma.emailMessageTag.createMany({
    data: tagIds.map((tagId) => ({
      emailMessageId,
      emailTagId: tagId,
    })),
    skipDuplicates: true,
  });
}

async function ensureTags(names: string[]) {
  const ids: string[] = [];
  for (const name of names) {
    if (tagCache.has(name)) {
      ids.push(tagCache.get(name)!);
      continue;
    }
    const tag = await prisma.emailTag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tagCache.set(name, tag.id);
    ids.push(tag.id);
  }
  return ids;
}

async function processJob(jobId: string) {
  const job = await prisma.indexJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  try {
    await ingestMessages(job);
  } catch (err) {
    await prisma.indexJob.update({
      where: { id: jobId },
      data: {
        status: IndexJobStatus.FAILED,
        lastError: err instanceof Error ? err.message : "Unknown error",
      },
    });
  }
}

async function mainLoop() {
  for (;;) {
    const job = await claimQueuedJob();
    if (!job) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    await processJob(job.id);
  }
}

mainLoop().catch((err) => {
  console.error("Worker crashed:", err);
  process.exit(1);
});
