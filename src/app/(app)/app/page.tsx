import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AppHomePage() {
  const session = await getServerAuthSession();
  const dbUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
      })
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Overview
          </p>
          <h1 className="font-display text-3xl text-slate-900">
            Welcome back
          </h1>
          <p className="text-sm text-slate-600">
            Keep your inbox clean, searchable, and ready for the next task.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm">
          <span>
            Signed in as{" "}
            <span className="font-semibold text-slate-900">
              {dbUser?.email ?? session?.user?.email ?? "Unknown"}
            </span>
          </span>
          <SignOutButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white/80 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Account</h2>
          <p className="mt-2 text-xs text-slate-500">Connected identity</p>
          <p className="mt-3 text-sm font-medium text-slate-900">
            {dbUser?.email ?? session?.user?.email ?? "Unknown"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            DB record:{" "}
            <span className="font-semibold text-slate-700">
              {dbUser ? (dbUser.name ?? "No name") : "Not found"}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white/80 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Indexing</h2>
          <p className="mt-2 text-sm text-slate-600">
            Status:{" "}
            <span className="font-semibold text-slate-900">Not started</span>
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Run a full pass to unlock smart search and auto-tagging.
          </p>
          <Link
            href="/app/index"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800"
          >
            Start indexing
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white/80 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Next steps</h2>
          <p className="mt-2 text-xs text-slate-500">
            Jump back into your workflow.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <Link
              href="/app/inbox"
              className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Review latest emails
              <span className="text-xs text-slate-400">Inbox</span>
            </Link>
            <Link
              href="/app/search"
              className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Search across history
              <span className="text-xs text-slate-400">Search</span>
            </Link>
            <Link
              href="/app/tasks"
              className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Turn emails into tasks
              <span className="text-xs text-slate-400">Tasks</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
