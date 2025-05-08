// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "~/server/auth";

// A simplified middleware that doesn't use Prisma directly
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define routes that require authentication
  const protectedRoutes = ["/profile", "/report"];
  
  // Define authentication routes
  const authRoutes = ["/login"];
  
  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  
  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );
  
  // For protected routes, check session without using Prisma
  if (isProtectedRoute) {
    // Instead of calling auth(), redirect preemptively
    // This avoids calling Prisma in the edge runtime
    const authCookie = request.cookies.get("next-auth.session-token");
    if (!authCookie) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }
  
  // For auth routes, check cookie presence without Prisma
  if (isAuthRoute) {
    const authCookie = request.cookies.get("next-auth.session-token");
    if (authCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};