import { NextRequest, NextResponse } from "next/server";

const INVITE_CODE = process.env.URAI_INVITE_CODE;

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const devKey = req.headers.get("urai-dev-key");

  // The `basePath` of `/studio` is stripped from the pathname, 
  // so we check for paths relative to the studio route.
  // Allow access to the waitlist page itself, and all API routes.
  if (pathname.startsWith("/waitlist") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Check for invite code from query param or a dev key from headers.
  const inviteCode = searchParams.get("inviteCode");
  if (inviteCode === INVITE_CODE || devKey === process.env.URAI_DEV_KEY) {
    return NextResponse.next();
  }

  // Check if the user is on the waitlist by calling the auth check API.
  const email = searchParams.get("email");
  if (email) {
    const checkUrl = req.nextUrl.clone();
    checkUrl.pathname = "/api/auth/check";
    checkUrl.search = `email=${encodeURIComponent(email)}`;
    
    try {
      const checkRes = await fetch(checkUrl);
      if (checkRes.ok) {
        const { authorized } = await checkRes.json();
        if (authorized) {
          return NextResponse.next();
        }
      }
    } catch (error) {
      console.error("Middleware fetch error:", error);
      // If the check fails, fall through to redirecting to waitlist.
    }
  }

  // If none of the access conditions are met, redirect to the waitlist page.
  const url = req.nextUrl.clone();
  url.pathname = "/waitlist";
  return NextResponse.redirect(url);
}

export const config = {
  // Match all paths except for static files, images, and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
