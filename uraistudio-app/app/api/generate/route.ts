import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/server/firebaseAdmin";
import admin from "firebase-admin";

const BodySchema = z.object({
  mode: z.literal("auto").default("auto"),
  target: z.enum(["shorts", "youtube", "ads"]).default("shorts"),
  media: z.array(z.object({
    kind: z.enum(["video", "image"]),
    name: z.string(),
    size: z.number().optional()
  })).default([])
});

export async function POST(req: Request) {
  const db = adminDb;

  let body: any = {};
  try { body = await req.json(); } catch {}
  const input = BodySchema.parse(body ?? {});

  const ref = db.collection("jobs").doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await ref.set({
    status: "queued",
    input,
    createdAt: now,
    updatedAt: now
  });

  return NextResponse.json({ jobId: ref.id });
}
