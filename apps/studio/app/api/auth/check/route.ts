import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const email = searchParams.get("email");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ authorized: false, error: "invalid_email" }, { status: 400 });
  }

  try {
    const db = adminDb();
    const id = crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 32);
    const doc = await db.collection("waitlist").doc(id).get();

    if (doc.exists) {
      return NextResponse.json({ authorized: true });
    } else {
      return NextResponse.json({ authorized: false });
    }
  } catch (error) {
    console.error("Error checking waitlist:", error);
    return NextResponse.json({ authorized: false, error: "internal_server_error" }, { status: 500 });
  }
}
