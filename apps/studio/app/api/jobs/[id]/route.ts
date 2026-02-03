
// apps/studio/app/api/jobs/[id]/route.ts

import { NextResponse } from "next/server";
import { firestore } from "../../../../../lib/firebase-admin";
import { StudioJob, StudioAudit } from "../../../schemas";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const jobId = params.id;

  if (!jobId) {
    return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
  }

  try {
    // Fetch the job details
    const jobRef = firestore.collection("studioJobs").doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobDoc.data() as StudioJob;

    // Fetch the audit logs for the job
    const auditRef = firestore.collection("studioAudit").where("jobId", "==", jobId).orderBy("at", "desc");
    const auditSnapshot = await auditRef.get();
    const auditLogs = auditSnapshot.docs.map(doc => doc.data() as StudioAudit);

    return NextResponse.json({ job, auditLogs });

  } catch (error: any) {
    console.error(`Error fetching job details for ${jobId}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
