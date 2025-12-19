import Link from "next/link";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link
            href="/app"
            className="text-base font-semibold tracking-tight text-slate-900"
          >
            InboxIQ
          </Link>
          <div className="ml-auto flex items-center gap-4 text-sm text-slate-500">
            <Link
              href="/app/inbox"
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Inbox
            </Link>
            <Link
              href="/app/search"
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Search
            </Link>
            <Link
              href="/app/tasks"
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Tasks
            </Link>
            <Link
              href="/app/index"
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Index
            </Link>
            <Link
              href="/app/settings"
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Settings
            </Link>
            <span>Prototype</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <main className="min-w-0">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
