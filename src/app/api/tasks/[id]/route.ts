import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.status !== "AUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: "Missing status field" }, { status: 400 });
    }

    // Validate task status
    if (!["TODO", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Fetch task
    const task = await db.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Authorization check: Regular user must be the assignee
    if (session.user.role === "USER" && task.assignedToId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied. You can only update tasks assigned to you." },
        { status: 403 }
      );
    }

    // Update status
    const updatedTask = await db.task.update({
      where: { id },
      data: { status },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Update task status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
