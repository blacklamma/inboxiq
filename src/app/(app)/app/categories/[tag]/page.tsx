import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function CategoryPage({
  params,
}: {
  params: { tag: string };
}) {
  const tagName = decodeURIComponent(params.tag);
  const session = await getServerAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="text-sm text-slate-600">
        Please sign in to view categorized emails.
      </div>
    );
  }

  const tag = await prisma.emailTag.findUnique({
    where: { name: tagName },
  });

  const messages = tag
    ? await prisma.emailMessage.findMany({
        where: {
          userId,
          tags: { some: { emailTagId: tag.id } },
        },
        include: {
          tags: { include: { tag: true } },
        },
        orderBy: { date: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {tagName}
          </h1>
          <p className="text-sm text-slate-600">
            Showing latest emails tagged as {tagName}.
          </p>
        </div>
        <Link
          href="/app/inbox"
          className="text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          Back to Inbox
        </Link>
      </div>

      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {messages.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">
            No emails found for this tag.
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start gap-4 p-4">
              <div className="h-8 w-8 rounded-full bg-slate-100 text-center text-sm leading-8 font-semibold text-slate-700">
                {(message.from ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {message.subject ?? "(No subject)"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(message.date ?? null)}
                  </div>
                </div>
                <div className="truncate text-sm text-slate-700">
                  {message.from ?? "Unknown sender"}
                </div>
                <div className="line-clamp-2 text-xs text-slate-600">
                  {message.cleanedText ?? message.snippet ?? ""}
                </div>
                {message.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.tags.map((t) => (
                      <Link
                        key={t.emailTagId}
                        href={`/app/categories/${encodeURIComponent(t.tag.name)}`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        {t.tag.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
