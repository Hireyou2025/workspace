"use client";

import { signOut } from "next-auth/react";
import { ShieldAlert, LogOut } from "lucide-react";

export function RevokedScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-red-500/20 bg-zinc-900/50 p-8 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-red-400">
            Access Revoked
          </h2>
          <p className="text-sm text-zinc-400">
            Your access to this workspace has been revoked by the system administrator. If you believe this is an error, please contact the admin.
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
