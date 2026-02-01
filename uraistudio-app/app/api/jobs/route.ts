import { NextResponse } from "next/server";
import { adminDb } from "@/server/firebaseAdmin";

export async function POST(req: Request) {
  const { projectId, ownerId, media } = await req.json();

  // In a real application, you would add more validation here.
  if (!projectId || !ownerId || !media) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const jobRef = await adminDb.collection("studioJobs").add({
    projectId,
    ownerId,
    media,
    status: "pending",
    createdAt: new Date(),
  });

  return NextResponse.json({ jobId: jobRef.id });
}
