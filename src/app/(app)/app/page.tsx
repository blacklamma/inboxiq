import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AppHomePage() {
  const session = await getServerAuthSession();
  const dbUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
      })
    : null;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">
        InboxIQ
      </h1>
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-slate-600">
          Signed in as{" "}
          <span className="font-medium text-slate-900">
            {dbUser?.email ?? session?.user?.email ?? "Unknown"}
          </span>
        </div>
        <SignOutButton />
      </div>
      <div className="text-sm text-slate-600">
        User in DB:{" "}
        <span className="font-medium text-slate-900">
          {dbUser ? (dbUser.name ?? "No name") : "Not found"}
        </span>
      </div>
      <p className="text-sm text-slate-600">Indexing status: Not started</p>
    </div>
  );
}
