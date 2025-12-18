import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignInButton } from "@/components/auth/sign-in-button";
import { ReconnectGmailButton } from "@/components/auth/reconnect-gmail-button";

export default async function SettingsPage() {
  const session = await getServerAuthSession();
  const account = session?.user?.id
    ? await prisma.connectedAccount.findUnique({
        where: {
          userId_provider: { userId: session.user.id, provider: "google" },
        },
      })
    : null;

  const gmailConnected = Boolean(account?.encryptedRefreshToken);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="text-sm text-slate-600">
            Manage your Gmail connection and account.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Back to app
          </Link>
          <SignOutButton />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Signed in as{" "}
        <span className="font-semibold">
          {session?.user?.email ?? "Unknown"}
        </span>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Gmail connection
            </div>
            <div className="text-sm text-slate-600">
              Status:{" "}
              <span
                className={
                  gmailConnected ? "text-emerald-700" : "text-amber-700"
                }
              >
                {gmailConnected ? "Connected" : "Not connected"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {session ? <ReconnectGmailButton /> : <SignInButton />}
          </div>
        </div>
      </div>
    </div>
  );
}
