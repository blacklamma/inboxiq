import Link from "next/link";
import { SignInButton } from "@/components/auth/sign-in-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getServerAuthSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="text-lg font-semibold tracking-tight text-slate-900">
          InboxIQ
        </div>
        <Link
          href="/app"
          className="text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          Open app
        </Link>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
          A clean inbox, without the busywork.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-pretty text-slate-600">
          InboxIQ connects to Gmail and helps you categorize and index email so
          you can search and act faster.
        </p>

        <div className="mt-8 flex items-center gap-3">
          {session ? (
            <>
              <Link
                href="/app"
                className="inline-flex h-11 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                Continue to InboxIQ
              </Link>
              <SignOutButton />
            </>
          ) : (
            <SignInButton />
          )}
        </div>
      </main>
    </div>
  );
}
