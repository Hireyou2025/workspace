"use client";

import { signOut } from "next-auth/react";
import { Clock, LogOut } from "lucide-react";

export function PendingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 animate-pulse">
          <Clock className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Awaiting Authorization
          </h2>
          <p className="text-sm text-zinc-400">
            Your account is awaiting authorization from the system administrator. You will receive access once approved.
          </p>
        </div>

        <div className="border-t border-zinc-800 pt-6">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors duration-200 focus:outline-none"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
