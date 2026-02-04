import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { Firestore } from "firebase-admin/firestore";

export async function handleWaitlistPost(req: NextRequest, db: Firestore) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const id = crypto.createHash("sha256").update(email).digest("hex").slice(0, 32);

  await db.collection("waitlist").doc(id).set(
    {
      email,
      createdAt: new Date().toISOString(),
      source: String(body.source || ""),
      userAgent: req.headers.get("user-agent") || "",
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
