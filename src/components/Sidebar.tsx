"use client";

import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  LogOut, 
  User as UserIcon,
  Shield,
  Briefcase
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900/40 flex flex-col h-screen shrink-0">
      {/* Header logo */}
      <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-white uppercase">
            WorkSphere
          </h1>
          <p className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase flex items-center gap-1">
            {isAdmin ? (
              <>
                <Shield className="h-3 w-3 text-indigo-400" />
                Admin Portal
              </>
            ) : (
              "Workspace"
            )}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {isAdmin ? (
          <>
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === "overview"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              Overview
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === "users"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              User Directory
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <CheckSquare className="h-4.5 w-4.5" />
              Global Tasks
            </button>
          </>
        ) : (
          <button
            onClick={() => setActiveTab("workspace")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === "workspace"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            }`}
          >
            <CheckSquare className="h-4.5 w-4.5" />
            My Tasks
          </button>
        )}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-zinc-800 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <UserIcon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-200 truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-[10px] text-zinc-500 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
