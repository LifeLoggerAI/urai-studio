
// apps/studio/app/api/jobs/enqueue/route.ts

import { NextResponse } from "next/server";
import { firestore } from "../../../../lib/firebase-admin"; // Assumed firebase admin setup
import { StudioJob, StudioJobType, StudioJobStatus } from "../../schemas/studioJobs";
import { StudioAudit } from "../../schemas/studioAudit";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const { type, source, input, groupKey, idempotencyKey: providedIdempotencyKey } = await request.json();

  if (!type || !source || !input) {
    return NextResponse.json({ error: "Missing required fields: type, source, and input" }, { status: 400 });
  }

  const idempotencyKey = providedIdempotencyKey || `${type}:${source.ref}`;
  const jobsRef = firestore.collection("studioJobs");

  try {
    let job: StudioJob | null = null;

    // Transaction to ensure atomicity
    await firestore.runTransaction(async (transaction) => {
      const existingJobQuery = jobsRef
        .where("idempotencyKey", "==", idempotencyKey)
        .where("status", "in", ["QUEUED", "RUNNING", "SUCCEEDED"]);
      
      const existingJobSnapshot = await transaction.get(existingJobQuery);

      if (!existingJobSnapshot.empty) {
        // If a job with the same idempotency key exists, return it
        job = existingJobSnapshot.docs[0].data() as StudioJob;
        return;
      }

      // If no job exists, create a new one
      const jobId = uuidv4();
      const now = new Date();
      const newJob: StudioJob = {
        jobId,
        type,
        status: "QUEUED",
        idempotencyKey,
        groupKey: groupKey || source.ref,
        priority: 100,
        source,
        input,
        attempts: 0,
        maxAttempts: 5,
        lease: {},
        createdAt: now,
        updatedAt: now,
      };

      const jobRef = jobsRef.doc(jobId);
      transaction.set(jobRef, newJob);
      job = newJob;

      // Create an audit log entry
      const auditLogRef = firestore.collection("studioAudit").doc(uuidv4());
      const auditLog: StudioAudit = {
        auditId: auditLogRef.id,
        at: now,
        actor: { uid: "system" }, // Replace with actual user ID
        action: "JOB_CREATED",
        jobId,
      };
      transaction.set(auditLogRef, auditLog);
    });

    if (job) {
      return NextResponse.json(job, { status: job.jobId ? 201 : 200 });
    } else {
      // This case should ideally not be reached in a successful transaction
      return NextResponse.json({ error: "Failed to create or retrieve job" }, { status: 500 });
    }

  } catch (error) {
    console.error("Error enqueuing job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
