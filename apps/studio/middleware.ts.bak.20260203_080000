import { NextRequest, NextResponse } from "next/server";

// NOTE: Middleware runs on the Edge runtime.
// Do NOT import firebase-admin / node:* modules here.
// RBAC will be enforced in Node runtime route handlers (/app/api/*) and server components.

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}
