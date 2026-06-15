import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Restrict Admin API routes to ADMIN role only
    if (path.startsWith("/api/admin") && token?.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({ error: "Access denied. Admin role required." }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Next.js 16 proxy export convention
export function proxy(req: any, event: any) {
  return authMiddleware(req, event);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
  ],
};
