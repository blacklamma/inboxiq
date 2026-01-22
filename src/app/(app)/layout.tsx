import Link from "next/link";
import { NavLink } from "@/components/nav-link";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link
            href="/app"
            className="font-display text-lg font-semibold tracking-tight text-slate-900"
          >
            InboxIQ
          </Link>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            Prototype
          </span>
          <nav className="ml-auto flex flex-wrap items-center gap-1 rounded-full border border-slate-200/70 bg-white/80 p-1 shadow-sm shadow-slate-200/50">
            <NavLink href="/app/inbox" label="Inbox" />
            <NavLink href="/app/search" label="Search" />
            <NavLink href="/app/tasks" label="Tasks" />
            <NavLink href="/app/index" label="Index" />
            <NavLink href="/app/settings" label="Settings" />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <main className="min-w-0">
          <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-8 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.6)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
