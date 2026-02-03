import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) return NextResponse.json({ ok: false, error: "missing_token" }, { status: 401 });

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return NextResponse.json({ ok: true, uid: decoded.uid, claims: decoded });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }
}
