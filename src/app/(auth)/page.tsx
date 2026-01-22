import Link from "next/link";
import { SignInButton } from "@/components/auth/sign-in-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getServerAuthSession();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="font-display text-lg font-semibold tracking-tight text-slate-900">
            InboxIQ
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            Preview
          </span>
        </div>
        <Link
          href="/app"
          className="rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          Open app
        </Link>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200/80 bg-white/80 p-10 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.6)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            AI-assisted inbox
          </p>
          <h1 className="mt-4 text-balance font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            A clean inbox, without the busywork.
          </h1>
          <p className="mt-4 text-pretty text-base leading-7 text-slate-600">
            InboxIQ connects to Gmail and helps you categorize and index email so
            you can search and act faster.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {session ? (
              <>
                <Link
                  href="/app"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  Continue to InboxIQ
                </Link>
                <SignOutButton />
              </>
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
