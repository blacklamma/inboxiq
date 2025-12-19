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

const PAGE_SIZE = 20;

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  const totalMessages = userId
    ? await prisma.emailMessage.count({ where: { userId } })
    : 0;
  const totalPages = Math.max(1, Math.ceil(totalMessages / PAGE_SIZE));
  const requestedPage = Number(searchParams?.page) || 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const messages = userId
    ? await prisma.emailMessage.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        include: {
          tags: { include: { tag: true } },
        },
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      })
    : [];
  const rangeStart = totalMessages === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalMessages);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Inbox
          </h1>
          <p className="text-sm text-slate-600">
            {totalMessages > 0
              ? `Showing ${rangeStart}-${rangeEnd} of ${totalMessages} emails.`
              : "Showing your latest indexed emails."}
          </p>
        </div>
        <Link
          href="/app/index"
          className="text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          Run indexing
        </Link>
      </div>

      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {messages.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">
            No emails indexed yet.
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

      {messages.length > 0 ? (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/app/inbox?page=${Math.max(1, currentPage - 1)}`}
              className={`rounded-md border px-3 py-1 font-medium ${
                currentPage === 1
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
              }`}
              aria-disabled={currentPage === 1}
            >
              Previous
            </Link>
            <Link
              href={`/app/inbox?page=${Math.min(totalPages, currentPage + 1)}`}
              className={`rounded-md border px-3 py-1 font-medium ${
                currentPage === totalPages
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
              }`}
              aria-disabled={currentPage === totalPages}
            >
              Next
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
