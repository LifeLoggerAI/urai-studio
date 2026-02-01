import { NextResponse } from "next/server";
import { adminDb } from "@/server/firebaseAdmin";
import admin from "firebase-admin";

export async function GET(req: Request, { params }: { params: { jobId: string } }) {
  const { jobId } = params;
  const jobDoc = await adminDb.collection("studioJobs").doc(jobId).get();

  if (!jobDoc.exists) {
    return new NextResponse("Job not found", { status: 404 });
  }

  return NextResponse.json(jobDoc.data());
}
