import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function requireSession() {
  const c = await cookies();
  const session = c.get("__session")?.value || "";
  if (!session) throw new Error("no_session");
  const auth = adminAuth;
  const decoded = await auth.verifySessionCookie(session, true);
  return { uid: decoded.uid, email: decoded.email || null };
}
