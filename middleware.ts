import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAdminRoute = req.nextUrl.pathname.startsWith("/admin") ||
            req.nextUrl.pathname.startsWith("/api/admin");

        if (isAdminRoute && token?.role !== "admin") {
            return NextResponse.rewrite(new URL("/auth/signin?error=AccessDenied", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*", "/dashboard/:path*", "/inventory/:path*", "/approvals/:path*"],
};
