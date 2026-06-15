"use client";

import { Session } from "next-auth";
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { 
  Users, 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Calendar, 
  MessageSquare, 
  AlertCircle,
  Loader2,
  X,
  Send,
  UserCheck,
  UserX,
  ChevronRight,
  TrendingUp
} from "lucide-react";

interface DashboardClientProps {
  session: Session;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  dueDate: string | null;
  createdAt: string;
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
    status?: string;
  };
  assignedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  _count?: {
    comments: number;
  };
}

interface ToastMessage {
  type: "success" | "error";
  text: string;
}

export default function DashboardClient({ session }: DashboardClientProps) {
  const isAdmin = session.user.role === "ADMIN";
  const [activeTab, setActiveTab] = useState(isAdmin ? "overview" : "workspace");

  // State lists
  const [users, setUsers] = useState<UserData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  
  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  // Form state
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPriority, setCreatePriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [createAssignee, setCreateAssignee] = useState("");
  const [createDueDate, setCreateDueDate] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Detail panel state
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const triggerToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch functions
  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        triggerToast("error", "Failed to fetch user directory");
      }
    } catch (err) {
      triggerToast("error", "An error occurred fetching users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const endpoint = isAdmin ? "/api/admin/tasks" : "/api/tasks";
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        triggerToast("error", "Failed to load tasks");
      }
    } catch (err) {
      triggerToast("error", "An error occurred loading tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  // Fetch comments for a specific task
  const fetchComments = async (taskId: string) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      } else {
        triggerToast("error", "Failed to load comments");
      }
    } catch (err) {
      triggerToast("error", "An error occurred loading comments");
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Load comments when task is selected
  useEffect(() => {
    if (selectedTask) {
      fetchComments(selectedTask.id);
    }
  }, [selectedTask]);

  // Toggle user status
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    setActionUserId(userId);
    const newStatus = currentStatus === "AUTHORIZED" ? "REVOKED" : "AUTHORIZED";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        triggerToast("success", `User access ${newStatus === "AUTHORIZED" ? "approved" : "revoked"} successfully`);
        // Refresh tasks as user status change could impact task list metadata
        fetchTasks();
      } else {
        triggerToast("error", data.error || "Failed to update user status");
      }
    } catch (err) {
      triggerToast("error", "An error occurred updating user status");
    } finally {
      setActionUserId(null);
    }
  };

  // Create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle || !createAssignee) {
      triggerToast("error", "Title and assignee are required");
      return;
    }
    setSubmittingTask(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle,
          description: createDesc || null,
          priority: createPriority,
          assignedToId: createAssignee,
          dueDate: createDueDate || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTasks([data, ...tasks]);
        triggerToast("success", "Task created and assigned successfully");
        setIsTaskModalOpen(false);
        // Reset form
        setCreateTitle("");
        setCreateDesc("");
        setCreatePriority("MEDIUM");
        setCreateAssignee("");
        setCreateDueDate("");
      } else {
        triggerToast("error", data.error || "Failed to create task");
      }
    } catch (err) {
      triggerToast("error", "An error occurred creating task");
    } finally {
      setSubmittingTask(false);
    }
  };

  // Update task status (for assigned users or admin)
  const handleUpdateTaskStatus = async (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "COMPLETED") => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        setTasks(updatedTasks);
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, status: newStatus });
        }
        triggerToast("success", `Task updated to ${newStatus.replace("_", " ")}`);
      } else {
        triggerToast("error", data.error || "Failed to update task");
      }
    } catch (err) {
      triggerToast("error", "An error occurred updating task");
    }
  };

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newCommentText }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments([...comments, data]);
        // Update comment count on local task item
        setTasks(tasks.map(t => t.id === selectedTask.id ? { 
          ...t, 
          _count: { comments: (t._count?.comments || 0) + 1 } 
        } : t));
        setNewCommentText("");
        triggerToast("success", "Comment posted");
      } else {
        triggerToast("error", data.error || "Failed to post comment");
      }
    } catch (err) {
      triggerToast("error", "An error occurred posting comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Metrics (Admin-only)
  const authorizedUsersCount = users.filter(u => u.status === "AUTHORIZED").length;
  const pendingApprovalsCount = users.filter(u => u.status === "PENDING").length;
  const activeTasksCount = tasks.filter(t => t.status !== "COMPLETED").length;
  const completedTasksCount = tasks.filter(t => t.status === "COMPLETED").length;

  const authorizedUsers = users.filter(u => u.status === "AUTHORIZED");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-in ${
          toast.type === "success" 
            ? "border-emerald-500/20 bg-emerald-950/80 text-emerald-400" 
            : "border-red-500/20 bg-red-950/80 text-red-400"
        }`}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">{toast.text}</span>
        </div>
      )}

      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-900/10">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800/80 px-8 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-white capitalize">
            {activeTab.replace("_", " ")}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-zinc-400 bg-zinc-800/60 px-3 py-1 rounded-full border border-zinc-700/50">
              {session.user.email}
            </span>
          </div>
        </header>

        {/* Dynamic content rendering */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB 1: ADMIN OVERVIEW */}
          {activeTab === "overview" && isAdmin && (
            <div className="space-y-8 max-w-7xl">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Card 1: Total Users */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Authorized Users
                    </p>
                    <p className="text-3xl font-extrabold text-white">
                      {loadingUsers ? <Loader2 className="h-6 w-6 animate-spin text-zinc-600" /> : authorizedUsersCount}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <UserCheck className="h-6 w-6" />
                  </div>
                </div>

                {/* Card 2: Pending Approvals */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Pending Approvals
                    </p>
                    <p className="text-3xl font-extrabold text-white">
                      {loadingUsers ? <Loader2 className="h-6 w-6 animate-spin text-zinc-600" /> : pendingApprovalsCount}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    pendingApprovalsCount > 0 ? "bg-amber-500/10 text-amber-500 animate-pulse" : "bg-zinc-800 text-zinc-500"
                  }`}>
                    <Clock className="h-6 w-6" />
                  </div>
                </div>

                {/* Card 3: Active Tasks */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Active Tasks
                    </p>
                    <p className="text-3xl font-extrabold text-white">
                      {loadingTasks ? <Loader2 className="h-6 w-6 animate-spin text-zinc-600" /> : activeTasksCount}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                </div>

                {/* Card 4: Completed Tasks */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Completed Tasks
                    </p>
                    <p className="text-3xl font-extrabold text-white">
                      {loadingTasks ? <Loader2 className="h-6 w-6 animate-spin text-zinc-600" /> : completedTasksCount}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>

              </div>

              {/* Workspace Health Info */}
              <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/30 via-zinc-900/20 to-indigo-950/10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-400" />
                    Workspace Health
                  </h3>
                  <p className="text-sm text-zinc-400 max-w-xl">
                    Everything is running smoothly. Monitor employee authorization requests, create or delegate workspace tasks, and track active deliverables from this dashboard.
                  </p>
                </div>
                {pendingApprovalsCount > 0 && (
                  <button
                    onClick={() => setActiveTab("users")}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors duration-200 cursor-pointer"
                  >
                    Review Approvals
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ADMIN USER DIRECTORY */}
          {activeTab === "users" && isAdmin && (
            <div className="space-y-6 max-w-7xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Registered Workspace Accounts</h3>
                  <p className="text-sm text-zinc-400">Approve pending applications or instantly revoke credentials.</p>
                </div>
                <button
                  onClick={fetchUsers}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors duration-200 cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              {loadingUsers && users.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Date Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {users.map((user) => {
                        const isSelf = user.email === session.user.email;
                        const isSuperAdmin = user.email === "mahindrachapa@gmail.com";
                        return (
                          <tr key={user.id} className="hover:bg-zinc-800/10">
                            <td className="px-6 py-4 font-medium text-white">{user.name || "N/A"}</td>
                            <td className="px-6 py-4 text-zinc-400">{user.email}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border ${
                                user.status === "AUTHORIZED"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : user.status === "PENDING"
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                                  : "bg-red-500/10 border-red-500/20 text-red-400"
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-400">
                              <span className={`px-2 py-0.5 rounded text-xs ${user.role === "ADMIN" ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/10" : "bg-zinc-800 text-zinc-500"}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500">
                              {new Date(user.createdAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isSuperAdmin ? (
                                <span className="text-xs font-semibold text-zinc-600 select-none">Super-Admin</span>
                              ) : isSelf ? (
                                <span className="text-xs font-semibold text-zinc-600 select-none">Active Session</span>
                              ) : (
                                <button
                                  onClick={() => handleToggleUserStatus(user.id, user.status)}
                                  disabled={actionUserId === user.id}
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                                    user.status === "AUTHORIZED"
                                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10"
                                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10"
                                  }`}
                                >
                                  {actionUserId === user.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : user.status === "AUTHORIZED" ? (
                                    <>
                                      <UserX className="h-3.5 w-3.5" />
                                      Revoke Access
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-3.5 w-3.5" />
                                      Authorize Account
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADMIN GLOBAL TASKS CONTROLS */}
          {activeTab === "tasks" && isAdmin && (
            <div className="space-y-6 max-w-7xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Global Workspace Tasks</h3>
                  <p className="text-sm text-zinc-400">Create, assign, and track completion progress across the platform.</p>
                </div>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  <Plus className="h-4 w-4" />
                  Create Task
                </button>
              </div>

              {loadingTasks && tasks.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 border-dashed bg-zinc-900/10 p-12 text-center text-zinc-500">
                  No tasks created yet. Click "Create Task" to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 shadow-sm hover:border-zinc-700/80 transition-all duration-200 cursor-pointer flex flex-col justify-between h-48 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide border uppercase ${
                            task.priority === "HIGH" 
                              ? "bg-red-500/10 border-red-500/20 text-red-400" 
                              : task.priority === "MEDIUM"
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-zinc-800 border-zinc-700 text-zinc-400"
                          }`}>
                            {task.priority} Priority
                          </span>
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide border uppercase ${
                            task.status === "COMPLETED"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : task.status === "IN_PROGRESS"
                              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse"
                              : "bg-zinc-800 border-zinc-700 text-zinc-400"
                          }`}>
                            {task.status.replace("_", " ")}
                          </span>
                        </div>
                        <h4 className="font-bold text-white truncate group-hover:text-indigo-400 transition-colors duration-200">
                          {task.title}
                        </h4>
                        <p className="text-zinc-400 text-xs line-clamp-2 h-8">
                          {task.description || "No description provided."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-800/80 pt-4 text-[11px] text-zinc-500">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="shrink-0">Assignee:</span>
                          <span className="font-semibold text-zinc-300 truncate">
                            {task.assignedTo.name || task.assignedTo.email}
                          </span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 shrink-0 text-zinc-400 font-semibold">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USER PERSONAL KANBAN WORKSPACE */}
          {activeTab === "workspace" && !isAdmin && (
            <div className="space-y-6 max-w-7xl h-full flex flex-col">
              <div>
                <h3 className="text-lg font-bold text-white">My assigned deliverables</h3>
                <p className="text-sm text-zinc-400">Interact with tasks assigned to you, update their status, and add comments.</p>
              </div>

              {loadingTasks && tasks.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 border-dashed bg-zinc-900/10 p-12 text-center text-zinc-500">
                  You do not have any tasks assigned to you.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Column 1: TODO */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                      <h4 className="font-bold text-sm text-zinc-400 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-zinc-500" />
                        To Do
                      </h4>
                      <span className="text-xs font-semibold text-zinc-500 px-2.5 py-0.5 rounded-full bg-zinc-800">
                        {tasks.filter(t => t.status === "TODO").length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {tasks.filter(t => t.status === "TODO").map(task => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 shadow-sm hover:border-zinc-700/80 transition-all duration-200 cursor-pointer space-y-3 group"
                        >
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-semibold tracking-wide border uppercase ${
                            task.priority === "HIGH" ? "bg-red-500/10 border-red-500/20 text-red-400" : task.priority === "MEDIUM" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"
                          }`}>
                            {task.priority}
                          </span>
                          <h5 className="font-bold text-white group-hover:text-indigo-400 transition-colors duration-200 truncate">{task.title}</h5>
                          {task.description && <p className="text-zinc-400 text-xs line-clamp-2">{task.description}</p>}
                          
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-900">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                              <span>{task._count?.comments || 0}</span>
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1 font-semibold text-zinc-400">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: IN PROGRESS */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                      <h4 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        In Progress
                      </h4>
                      <span className="text-xs font-semibold text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-500/10">
                        {tasks.filter(t => t.status === "IN_PROGRESS").length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {tasks.filter(t => t.status === "IN_PROGRESS").map(task => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 shadow-sm hover:border-zinc-700/80 transition-all duration-200 cursor-pointer space-y-3 group"
                        >
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-semibold tracking-wide border uppercase ${
                            task.priority === "HIGH" ? "bg-red-500/10 border-red-500/20 text-red-400" : task.priority === "MEDIUM" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"
                          }`}>
                            {task.priority}
                          </span>
                          <h5 className="font-bold text-white group-hover:text-indigo-400 transition-colors duration-200 truncate">{task.title}</h5>
                          {task.description && <p className="text-zinc-400 text-xs line-clamp-2">{task.description}</p>}
                          
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-900">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                              <span>{task._count?.comments || 0}</span>
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1 font-semibold text-zinc-400">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: COMPLETED */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                      <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Completed
                      </h4>
                      <span className="text-xs font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10">
                        {tasks.filter(t => t.status === "COMPLETED").length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {tasks.filter(t => t.status === "COMPLETED").map(task => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 shadow-sm hover:border-zinc-700/80 transition-all duration-200 cursor-pointer space-y-3 group opacity-75 hover:opacity-100"
                        >
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-semibold tracking-wide border uppercase bg-zinc-800 border-zinc-700 text-zinc-400`}>
                            {task.priority}
                          </span>
                          <h5 className="font-bold text-zinc-300 group-hover:text-emerald-400 transition-colors duration-200 truncate line-through">{task.title}</h5>
                          {task.description && <p className="text-zinc-500 text-xs line-clamp-2">{task.description}</p>}
                          
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-900">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                              <span>{task._count?.comments || 0}</span>
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1 font-semibold text-zinc-500">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Slide-out Task Detail Side Panel */}
      {selectedTask && (
        <div className="fixed inset-0 z-40 flex justify-end bg-zinc-950/60 backdrop-blur-sm">
          {/* Background overlay click handler */}
          <div className="flex-1" onClick={() => setSelectedTask(null)} />

          {/* Panel */}
          <div className="w-full max-w-lg bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col h-full overflow-hidden animate-slide-left">
            
            {/* Panel Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <span className={`inline-flex rounded-md px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border uppercase ${
                selectedTask.priority === "HIGH" 
                  ? "bg-red-500/10 border-red-500/20 text-red-400" 
                  : selectedTask.priority === "MEDIUM"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
              }`}>
                {selectedTask.priority} Priority
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="h-8 w-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors duration-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Task Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">{selectedTask.title}</h3>
                <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description || "No description provided."}
                </div>
              </div>

              {/* Status Selector */}
              <div className="border-t border-zinc-800 pt-5 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Task Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["TODO", "IN_PROGRESS", "COMPLETED"] as const).map(statusOpt => (
                    <button
                      key={statusOpt}
                      onClick={() => handleUpdateTaskStatus(selectedTask.id, statusOpt)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                        selectedTask.status === statusOpt
                          ? statusOpt === "COMPLETED"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5"
                            : statusOpt === "IN_PROGRESS"
                            ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-500/5"
                            : "bg-zinc-800 border-zinc-700 text-zinc-200"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-400"
                      }`}
                    >
                      {statusOpt.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Metadata */}
              <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-5 text-xs text-zinc-400">
                <div className="space-y-1">
                  <p className="text-zinc-500 uppercase tracking-wider font-semibold">Assigned To</p>
                  <p className="text-zinc-200 font-medium">{selectedTask.assignedTo.name || selectedTask.assignedTo.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 uppercase tracking-wider font-semibold">Delegated By</p>
                  <p className="text-zinc-200 font-medium">{selectedTask.assignedBy.name || selectedTask.assignedBy.email}</p>
                </div>
                {selectedTask.dueDate && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-zinc-500 uppercase tracking-wider font-semibold">Due Date</p>
                    <p className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                      {new Date(selectedTask.dueDate).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Comment Feed Section */}
              <div className="border-t border-zinc-800 pt-5 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-zinc-400" />
                  Comments ({comments.length})
                </h4>

                {loadingComments && comments.length === 0 ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    No comments yet. Start the conversation below.
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                    {comments.map((comment) => (
                      <div key={comment.id} className="rounded-xl bg-zinc-950/30 border border-zinc-850 p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`font-semibold ${comment.user.role === "ADMIN" ? "text-indigo-400" : "text-zinc-300"}`}>
                            {comment.user.name || comment.user.email}
                          </span>
                          <span className="text-zinc-500">
                            {new Date(comment.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-normal whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Comment Input Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 shrink-0">
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  disabled={submittingComment}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim() || submittingComment}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-white transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shrink-0"
                >
                  {submittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create Workspace Task</h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors duration-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="task-title" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Task Title
                </label>
                <input
                  id="task-title"
                  type="text"
                  required
                  placeholder="Provide a descriptive title"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 px-4 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="task-desc" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Description
                </label>
                <textarea
                  id="task-desc"
                  rows={3}
                  placeholder="Detail the scope of work"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 px-4 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="task-priority" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value as any)}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 px-3 text-sm text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="task-due" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Due Date
                  </label>
                  <input
                    id="task-due"
                    type="date"
                    value={createDueDate}
                    onChange={(e) => setCreateDueDate(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 px-3 text-sm text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="task-assignee" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Assign To
                </label>
                <select
                  id="task-assignee"
                  required
                  value={createAssignee}
                  onChange={(e) => setCreateAssignee(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 px-3 text-sm text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="">Select an authorized user</option>
                  {authorizedUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {submittingTask && <Loader2 className="h-4 w-4 animate-spin" />}
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
