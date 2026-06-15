# Workspace & Task Manager with Strict RBAC

A secure, production-ready workspace and task management web application built using **Next.js (App Router)**, **Tailwind CSS**, **Lucide React**, and **Prisma ORM** connecting to **PostgreSQL/Supabase**.

## Core Features

### 1. Strict Authentication & Admin Security
*   **Super-Admin Privilege**: The email `mahindrachapa@gmail.com` is the absolute Super-Admin of the entire platform. Upon registration, this email is automatically granted the `ADMIN` role and `AUTHORIZED` status.
*   **Pending Approval Lockout**: When any other user registers, their status is set to `PENDING` by default. They are immediately locked out of the dashboard until authorized.
*   **Admin Panel Approvals**: The Admin is the only user who can access the Admin Management Portal to change user statuses from `PENDING` to `AUTHORIZED` or `REVOKED`.
*   **Super-Admin Protection**: The platform prevents downgrading or revoking the Super-Admin user.

### 2. Admin Management Dashboard
*   **User Directory Grid**: Lists all registered accounts (Name, Email, Status, Date Joined) with inline single-click Authorize/Revoke access toggles.
*   **Global Task Controls**: Modal panel to create tasks, assign them to authorized users, define priorities (`LOW`, `MEDIUM`, `HIGH`), set due dates, and track their state.
*   **Workspace Analytics**: Quick cards showing Total Authorized Users, Pending Approvals, Total Active Tasks, and Completed Tasks.

### 3. User Workspace
*   **My Tasks Kanban Board**: Splits assigned deliverables into three drag/transition-friendly columns: `To Do`, `In Progress`, and `Completed`.
*   **Task Level Restrictions**: Regular users can only see, update the status of, and write comments on tasks specifically assigned to them by the Admin.
*   **Splash Screen Gates**: Clear, locked splash screens for users whose access is `PENDING` or `REVOKED`.

---

## Tech Stack
*   **Framework**: Next.js 16 (App Router)
*   **Database ORM**: Prisma 7 (using PostgreSQL/Supabase with pg connection pool adapter)
*   **Styling**: Tailwind CSS v4 (Dark-mode first zinc-gray palette with indigo accents)
*   **Authentication**: NextAuth.js v4 (Credentials Provider)
*   **Icons**: Lucide React

---

## Getting Started

### 1. Configure Environment Variables
Create a `.env` file in the root directory and define the following variables (you can copy `.env.example` as a template):
```env
# Relational Database Connection String (Supabase/PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"

# NextAuth Security Configuration
# Generate a secret using: openssl rand -base64 32
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Synchronize Database Schema
Push the database schema models to your PostgreSQL/Supabase database:
```bash
npx prisma db push
```

### 3. Run Locally
Install dependencies and run the development server:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Vercel Deployment

This project is fully configured for zero-configuration deployments on Vercel:

1.  **Repository Setup**: Initialize Git and push your repository to GitHub (ensure `.env` is omitted via `.gitignore`).
2.  **Import to Vercel**: Connect your GitHub repository to Vercel.
3.  **Add Settings**: Configure your `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` environment variables in the Vercel dashboard.
4.  **Automatic Build**: Vercel will automatically trigger the `postinstall` script to build the Prisma Client before building the static pages.
