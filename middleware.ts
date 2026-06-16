import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Edge middleware enforcing role-based access. The JWT carries `role`, so we can
 * gate routes without a DB call. Each dashboard prefix maps to required roles;
 * anything else under the matcher just needs a valid session.
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    const denied = (to: string) => NextResponse.redirect(new URL(to, req.url));

    if (pathname.startsWith("/admin") && role !== "admin") {
      return denied("/dashboard");
    }
    if (pathname.startsWith("/teacher") && role !== "teacher" && role !== "admin") {
      return denied("/dashboard");
    }
    // /dashboard is for any signed-in user (students included) — no extra check.
    return NextResponse.next();
  },
  {
    callbacks: {
      // Returning false here bounces unauthenticated users to the signIn page.
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  // Protect the three dashboards and their sub-routes only.
  matcher: ["/dashboard/:path*", "/teacher/:path*", "/admin/:path*"],
};
