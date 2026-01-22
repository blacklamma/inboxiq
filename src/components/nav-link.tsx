"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  label: string;
};

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/app" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
        isActive
          ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}
