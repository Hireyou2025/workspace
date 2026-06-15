import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const tasks = await db.task.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Fetch admin tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { title, description, priority, assignedToId, dueDate } = await req.json();

    if (!title || !assignedToId) {
      return NextResponse.json({ error: "Missing required fields (title, assignedToId)" }, { status: 400 });
    }

    // Verify target user is authorized
    const targetUser = await db.user.findUnique({
      where: { id: assignedToId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Assignee user not found" }, { status: 404 });
    }

    if (targetUser.status !== "AUTHORIZED") {
      return NextResponse.json(
        { error: "Cannot assign tasks to a user who is not AUTHORIZED" },
        { status: 400 }
      );
    }

    // Validate priority
    if (priority && !["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority value" }, { status: 400 });
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        status: "TODO",
        assignedToId,
        assignedById: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
