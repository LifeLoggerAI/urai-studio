import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { handleWaitlistPost } from "api-helpers";

export async function POST(req: NextRequest) {
  const db = adminDb();
  return handleWaitlistPost(req, db);
}
