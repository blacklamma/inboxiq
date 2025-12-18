import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

type SearchBody = {
  query: string;
  sender?: string;
  tag?: string;
  from?: string;
  to?: string;
};

type Scored = {
  id: string;
  score: number;
  reasons: string[];
};

const openai =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

function parseDateRange(query: string) {
  const q = query.toLowerCase();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (q.includes("today")) {
    return { from: startOfDay, to: now };
  }
  if (q.includes("yesterday")) {
    const y = new Date(startOfDay);
    y.setDate(y.getDate() - 1);
    const end = new Date(startOfDay);
    end.setMilliseconds(-1);
    return { from: y, to: end };
  }
  if (q.includes("last 7 days") || q.includes("last week")) {
    const from = new Date(startOfDay);
    from.setDate(from.getDate() - 7);
    return { from, to: now };
  }
  if (q.includes("last 30 days") || q.includes("last month")) {
    const from = new Date(startOfDay);
    from.setDate(from.getDate() - 30);
    return { from, to: now };
  }
  if (q.includes("last year")) {
    const from = new Date(startOfDay);
    from.setFullYear(from.getFullYear() - 1);
    return { from, to: now };
  }
  return { from: null, to: null };
}

type KeywordWhere = {
  userId: string;
  AND?: Record<string, unknown>[];
};

function buildKeywordWhere({
  userId,
  query,
  sender,
  tag,
  from,
  to,
}: {
  userId: string;
  query: string;
  sender?: string;
  tag?: string;
  from?: Date | null;
  to?: Date | null;
}) {
  const where: KeywordWhere = { userId };
  const and: Record<string, unknown>[] = [];

  if (query) {
    and.push({
      OR: [
        { subject: { contains: query, mode: "insensitive" } },
        { cleanedText: { contains: query, mode: "insensitive" } },
        { snippet: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (sender) {
    and.push({ from: { contains: sender, mode: "insensitive" } });
  }

  if (tag) {
    and.push({
      tags: {
        some: {
          tag: { name: { equals: tag } },
        },
      },
    });
  }

  if (from) and.push({ date: { gte: from } });
  if (to) and.push({ date: { lte: to } });

  if (and.length) where.AND = and;
  return where;
}

function asVectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

async function semanticSearch({
  userId,
  queryEmbedding,
  sender,
  tag,
  from,
  to,
}: {
  userId: string;
  queryEmbedding: number[];
  sender?: string;
  tag?: string;
  from?: Date | null;
  to?: Date | null;
}) {
  const vectorLiteral = asVectorLiteral(queryEmbedding);
  const conditions: string[] = [`"EmailMessage"."userId" = ${userId}`];

  if (sender) {
    conditions.push(`"EmailMessage"."from" ILIKE '%' || ${sender} || '%'`);
  }
  if (from) {
    conditions.push(`"EmailMessage"."date" >= ${from}`);
  }
  if (to) {
    conditions.push(`"EmailMessage"."date" <= ${to}`);
  }
  if (tag) {
    conditions.push(
      `"EmailMessage"."id" IN (SELECT "emailMessageId" FROM "EmailMessageTag" EMT JOIN "EmailTag" ET ON EMT."emailTagId" = ET."id" WHERE ET."name" = ${tag})`
    );
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const rows = await prisma.$queryRawUnsafe<{ id: string; score: number }[]>(
    `
    SELECT "EmailMessage"."id" as id,
           1 - ("Embedding"."vector" <#> ${vectorLiteral}::vector) AS score
    FROM "Embedding"
    JOIN "EmailMessage" ON "EmailMessage"."id" = "Embedding"."emailMessageId"
    ${whereClause}
    ORDER BY score DESC
    LIMIT 30;
  `
  );

  return rows;
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as SearchBody | null;
  const query = body?.query?.trim() ?? "";
  const sender = body?.sender?.trim() || undefined;
  const tag = body?.tag?.trim() || undefined;

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const parsedRange = parseDateRange(query);
  const from = body?.from ? new Date(body.from) : parsedRange.from;
  const to = body?.to ? new Date(body.to) : parsedRange.to;

  const keywordWhere = buildKeywordWhere({
    userId: session.user.id,
    query,
    sender,
    tag,
    from,
    to,
  });

  const keywordHits = await prisma.emailMessage.findMany({
    where: keywordWhere,
    select: { id: true },
    orderBy: { date: "desc" },
    take: 30,
  });

  const scoredMap = new Map<string, Scored>();
  for (const hit of keywordHits) {
    scoredMap.set(hit.id, {
      id: hit.id,
      score: 0.7,
      reasons: ["Keyword match"],
    });
  }

  if (openai) {
    try {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      const vector = embedding.data[0]?.embedding;
      if (vector) {
        const semanticHits = await semanticSearch({
          userId: session.user.id,
          queryEmbedding: vector,
          sender,
          tag,
          from,
          to,
        });
        for (const hit of semanticHits) {
          const existing = scoredMap.get(hit.id);
          const reason = `Semantic match (cosine ${(hit.score ?? 0).toFixed(2)})`;
          if (existing) {
            existing.score = Math.max(existing.score, hit.score ?? 0);
            if (!existing.reasons.includes(reason))
              existing.reasons.push(reason);
          } else {
            scoredMap.set(hit.id, {
              id: hit.id,
              score: hit.score ?? 0,
              reasons: [reason],
            });
          }
        }
      }
    } catch (err) {
      console.error("Semantic search failed", err);
    }
  }

  const combined = Array.from(scoredMap.values())
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 10);

  const ids = combined.map((c) => c.id);

  const messages = ids.length
    ? await prisma.emailMessage.findMany({
        where: { id: { in: ids } },
        include: { tags: { include: { tag: true } } },
      })
    : [];

  const messagesById = new Map(messages.map((m) => [m.id, m]));
  const results = combined
    .map((c) => {
      const message = messagesById.get(c.id);
      if (!message) return null;
      return { message, reasons: c.reasons };
    })
    .filter(Boolean);

  return NextResponse.json({ results });
}
