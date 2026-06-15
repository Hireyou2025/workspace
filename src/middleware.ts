import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
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

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
  ],
};
