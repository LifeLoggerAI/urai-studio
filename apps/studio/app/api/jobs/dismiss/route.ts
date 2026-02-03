
// apps/studio/app/api/jobs/dismiss/route.ts

import { NextResponse } from "next/server";
import { firestore } from "../../../../lib/firebase-admin";
import { StudioAudit } from "../../schemas";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const { jobId } = await request.json();

  if (!jobId) {
    return NextResponse.json({ error: "Missing required field: jobId" }, { status: 400 });
  }

  const jobRef = firestore.collection("studioJobs").doc(jobId);
  const dlqRef = firestore.collection("studioDLQ").where("jobId", "==", jobId);

  try {
    await firestore.runTransaction(async (transaction) => {
      const jobDoc = await transaction.get(jobRef);

      if (!jobDoc.exists) {
        throw new Error("Job not found");
      }

      // Update the job status to CANCELLED
      transaction.update(jobRef, { status: "CANCELLED", updatedAt: new Date() });

      // Delete the job from the DLQ
      const dlqSnapshot = await transaction.get(dlqRef);
      if (!dlqSnapshot.empty) {
        dlqSnapshot.docs.forEach((doc) => transaction.delete(doc.ref));
      }

      // Create an audit log for the dismiss action
      const auditLogRef = firestore.collection("studioAudit").doc(uuidv4());
      const auditLog: StudioAudit = {
        auditId: auditLogRef.id,
        at: new Date(),
        actor: { uid: "system" }, // Replace with actual user ID
        action: "DLQ_DISMISSED",
        jobId: jobId,
      };
      transaction.set(auditLogRef, auditLog);
    });

    return NextResponse.json({ message: `Job ${jobId} has been dismissed` });

  } catch (error: any) {
    console.error(`Error dismissing job ${jobId}:`, error);
    if (error.message === "Job not found") {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
