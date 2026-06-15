import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.status !== "AUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const tasks = await db.task.findMany({
      where: {
        assignedToId: session.user.id,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
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
    console.error("Fetch user tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
