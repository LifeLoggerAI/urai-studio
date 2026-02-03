
// apps/studio/app/api/jobs/worker/route.ts

import { NextResponse } from "next/server";
import { firestore } from "../../../../lib/firebase-admin";
import { StudioJob, StudioJobRun, StudioAudit, StudioJobType, StudioJobStatus } from "../../schemas";
import { v4 as uuidv4 } from "uuid";

const WORKER_ID = `worker-${uuidv4()}`;

// =================================================================
// Helper Functions
// =================================================================

async function updateJobProgress(jobId: string, status: StudioJobStatus, progress: number) {
  const jobRef = firestore.collection("studioJobs").doc(jobId);
  await jobRef.update({ status, progress, updatedAt: new Date() });
  console.log(`[${jobId}] Progress updated: ${status} (${progress}%)`);
}

// =================================================================
// Job Handlers
// =================================================================

async function handleClipPipelineV1(job: StudioJob): Promise<any> {
  console.log(`[${job.jobId}] Starting CLIP_PIPELINE_V1`);

  // 1. Analyzing Stage
  await updateJobProgress(job.jobId, "ANALYZING", 10);
  console.log(`[${job.jobId}] Input transcriptRef:`, job.input.transcriptRef);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate transcript fetch/load

  console.log(`[${job.jobId}] Analyzing transcript to find highlights...`);
  await updateJobProgress(job.jobId, "ANALYZING", 25);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate analysis
  const highlights = [
    { start: 30, end: 55, text: "This is the first interesting clip." },
    { start: 125, end: 150, text: "And here is a second one." },
    { start: 210, end: 235, text: "A third highlight for good measure." },
  ];
  await updateJobProgress(job.jobId, "ANALYZING", 40);

  // 2. Rendering Stage
  await updateJobProgress(job.jobId, "RENDERING", 50);
  console.log(`[${job.jobId}] Generating ${highlights.length} clips...`);
  const clipRefs: string[] = [];
  for (let i = 0; i < highlights.length; i++) {
    const highlight = highlights[i];
    console.log(`[${job.jobId}]   - Rendering clip #${i + 1} from ${highlight.start}s to ${highlight.end}s`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate rendering work
    const clipId = `clip_${uuidv4()}`;
    clipRefs.push(clipId);
    // Update progress after each clip is rendered
    const renderProgress = 50 + ((i + 1) / highlights.length) * 40; // Rendering is 50-90%
    await updateJobProgress(job.jobId, "RENDERING", Math.round(renderProgress));
  }

  // 3. Uploading Stage
  await updateJobProgress(job.jobId, "UPLOADING", 95);
  console.log(`[${job.jobId}] Uploading ${clipRefs.length} clips...`);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload

  console.log(`[${job.jobId}] Finished CLIP_PIPELINE_V1`);

  return {
    clipRefs: clipRefs,
    artifactRefs: [], // No other artifacts for now
  };
}

async function handleUnknownJob(job: StudioJob): Promise<any> {
    console.warn(`[${job.jobId}] Unknown job type: ${job.type}`);
    throw new Error(`Unknown job type: ${job.type}`);
}

const jobHandlers: { [key in StudioJobType]: (job: StudioJob) => Promise<any> } = {
  CLIP_PIPELINE_V1: handleClipPipelineV1,
  CAPTION_V1: handleUnknownJob,
  EXPORT_MP4_V1: handleUnknownJob,
  PUBLISH_TIKTOK_V1: handleUnknownJob,
};


// =================================================================
// Main Worker Logic
// =================================================================

export async function GET() {
  const jobsRef = firestore.collection("studioJobs");
  const now = new Date();

  const query = jobsRef.where("status", "==", "QUEUED").orderBy("priority", "asc").orderBy("createdAt", "asc").limit(10);

  const snapshot = await query.get();

  if (snapshot.empty) {
    return NextResponse.json({ message: "No jobs to process" });
  }

  const jobPromises = snapshot.docs.map(async (doc) => {
    let job = doc.data() as StudioJob;
    const jobRef = doc.ref;
    const runId = uuidv4();
    const runRef = firestore.collection("studioJobRuns").doc(runId);

    // --- 1. Lease the Job ---
    try {
      await firestore.runTransaction(async (transaction) => {
        const freshJobDoc = await transaction.get(jobRef);
        if (!freshJobDoc.exists) throw new Error("Job not found");
        const freshJob = freshJobDoc.data() as StudioJob;

        if (freshJob.status !== "QUEUED" || (freshJob.lease?.leaseUntil && freshJob.lease.leaseUntil.toDate() > now)) {
          return; // Job already leased or not in a runnable state
        }

        const leaseUntil = new Date(now.getTime() + 5 * 60 * 1000);
        transaction.update(jobRef, {
          status: "ANALYZING", // Start with the first state of the pipeline
          progress: 0,
          lease: { leasedBy: WORKER_ID, leaseUntil },
          attempts: (freshJob.attempts || 0) + 1,
          updatedAt: now,
        });

        transaction.set(runRef, { runId, jobId: freshJob.jobId, startedAt: now, worker: { id: WORKER_ID }, status: "RUNNING", input: freshJob.input } as StudioJobRun);
        transaction.set(firestore.collection("studioAudit").doc(uuidv4()), { auditId: uuidv4(), at: now, actor: { uid: WORKER_ID }, action: "JOB_LEASED", jobId: freshJob.jobId } as StudioAudit);
        
        // Update the local job object to reflect the transaction changes
        job = { ...freshJob, status: 'ANALYZING', progress: 0, attempts: (freshJob.attempts || 0) + 1 };
      });
    } catch (error: any) {
      if(error.message.includes("Job already leased")){
        return;
      }
      console.error(`[${job.jobId}] Failed to lease job:`, error.message);
      return;
    }

    // --- 2. Execute the Job ---
    let output: any;
    let jobFailed = false;
    let jobError: { message: string, code?: string, stack?: string } | null = null;

    try {
      const handler = jobHandlers[job.type] || handleUnknownJob;
      output = await handler(job);
    } catch (error: any) {
      console.error(`[${job.jobId}] Job execution failed:`, error);
      jobFailed = true;
      jobError = { message: error.message, stack: error.stack, code: error.code || 'EXECUTION_FAILURE' };
    }

    // --- 3. Finalize the Job ---
    try {
      await firestore.runTransaction(async (transaction) => {
        if (jobFailed) {
          const currentAttempts = job.attempts || 1;
          const isTerminal = currentAttempts >= (job.maxAttempts || 5);
          if (isTerminal) {
            transaction.update(jobRef, { status: "FAILED", progress: 100, lastError: { ...jobError, at: new Date() }, lease: {} });
            const dlqRef = firestore.collection("studioDLQ").doc(job.jobId);
            transaction.set(dlqRef, { dlqId: dlqRef.id, jobId: job.jobId, reason: "Terminal failure", lastError: { ...jobError, at: new Date() }, createdAt: new Date() });
            transaction.set(firestore.collection("studioAudit").doc(uuidv4()), { action: "DLQ_ENQUEUED", jobId: job.jobId, at: new Date(), actor: {uid: WORKER_ID} } as StudioAudit);
          } else {
            transaction.update(jobRef, { status: "QUEUED", progress: 0, lastError: { ...jobError, at: new Date() }, lease: {} });
          }
          transaction.update(runRef, { status: "FAILED", finishedAt: new Date(), error: jobError });
          transaction.set(firestore.collection("studioAudit").doc(uuidv4()), { action: "JOB_FAILED", jobId: job.jobId, at: new Date(), actor: {uid: WORKER_ID} } as StudioAudit);
        } else {
          transaction.update(jobRef, { status: "SUCCEEDED", progress: 100, output, lease: {}, lastError: null });
          transaction.update(runRef, { status: "SUCCEEDED", finishedAt: new Date(), output });
          transaction.set(firestore.collection("studioAudit").doc(uuidv4()), { action: "JOB_SUCCEEDED", jobId: job.jobId, at: new Date(), actor: {uid: WORKER_ID} } as StudioAudit);
        }
        transaction.update(jobRef, {updatedAt: new Date()});
      });
    } catch (error: any) {
      console.error(`[${job.jobId}] CRITICAL: Failed to finalize job status. Error:`, error.message);
    }
  });

  await Promise.all(jobPromises);

  return NextResponse.json({ message: `Attempted to process ${snapshot.size} jobs` });
}
