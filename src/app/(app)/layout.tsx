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
              href="/app/settings"
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Settings
            </Link>
            <span>Prototype</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Categories
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="rounded-md bg-slate-50 px-3 py-2">Primary</div>
              <div className="rounded-md bg-slate-50 px-3 py-2">Updates</div>
              <div className="rounded-md bg-slate-50 px-3 py-2">Promotions</div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
