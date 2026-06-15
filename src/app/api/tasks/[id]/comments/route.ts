import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.status !== "AUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;

    // Fetch task to check access
    const task = await db.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Regular user must be the assignee
    if (session.user.role === "USER" && task.assignedToId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied. You can only view comments for tasks assigned to you." },
        { status: 403 }
      );
    }

    const comments = await db.comment.findMany({
      where: { taskId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.status !== "AUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content cannot be empty" }, { status: 400 });
    }

    // Fetch task
    const task = await db.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Regular user must be the assignee
    if (session.user.role === "USER" && task.assignedToId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied. You can only comment on tasks assigned to you." },
        { status: 403 }
      );
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        taskId: id,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
