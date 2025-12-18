"use client";

import { signIn } from "next-auth/react";

export function ReconnectGmailButton() {
  return (
    <button
      type="button"
      onClick={() =>
        signIn("google", {
          callbackUrl: "/app",
          prompt: "consent",
          access_type: "offline",
        })
      }
      className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
    >
      Reconnect Gmail
    </button>
  );
}
