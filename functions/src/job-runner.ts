import { inspectFallbackJobLease, ownsFallbackJobLease } from './fallback-job-lease';
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

const db = admin.firestore();
const storage = admin.storage();

type JobOutput = {
  path?: string;
  message?: string;
  mode: "fallback";
  readyForExternalUse: false;
  contentType?: string;
  fallbackOnly: true;
};

const fallbackOutput = (input: {
  path?: string;
  message?: string;
  contentType?: string;
}): JobOutput => ({
  ...input,
  mode: "fallback",
  readyForExternalUse: false,
  fallbackOnly: true,
});

const writeAuditLog = (
  actorUid: string,
  action: string,
  target: string,
  before: unknown,
  after: unknown
) => {
  return db.collection("auditLogs").add({
    actorUid,
    action,
    target,
    before,
    after,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const logJobEvent = (
  jobId: string,
  type: "state_change" | "log" | "artifact",
  message: string,
  data: object = {}
) => {
  return db.collection("jobs").doc(jobId).collection("events").add({
    type,
    message,
    data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const processJob = async (job: admin.firestore.DocumentData): Promise<JobOutput> => {
  const { id, projectId, kind } = job;
  const bucket = storage.bucket();
  let outputFile;
  let outputData: JobOutput;

  switch (kind) {
    case "clip_render":
      outputFile = bucket.file(`projects/${projectId}/renders/${id}/fallback-clip.txt`);
      await outputFile.save("Fallback clip artifact.");
      outputData = fallbackOutput({ path: outputFile.name, contentType: "text/plain" });
      break;
    case "thumbnail":
      outputFile = bucket.file(`projects/${projectId}/renders/${id}/fallback-thumbnail.txt`);
      await outputFile.save("Fallback thumbnail artifact.");
      outputData = fallbackOutput({ path: outputFile.name, contentType: "text/plain" });
      break;
    case "captions":
      outputFile = bucket.file(`projects/${projectId}/renders/${id}/fallback-captions.srt`);
      await outputFile.save("1\n00:00:01,000 --> 00:00:02,000\nFallback caption artifact");
      outputData = fallbackOutput({ path: outputFile.name, contentType: "application/x-subrip" });
      break;
    case "package_export":
      outputFile = bucket.file(`projects/${projectId}/exports/${id}/fallback-package-manifest.json`);
      await outputFile.save(JSON.stringify({ mode: "fallback", readyForExternalUse: false, fallbackOnly: true }));
      outputData = fallbackOutput({ path: outputFile.name, contentType: "application/json" });
      break;
    case "publish":
      outputData = fallbackOutput({ message: "Publish job recorded in fallback mode." });
      break;
    default:
      throw new Error(`Unknown job kind: ${kind}`);
  }

  return outputData;
};

export const jobRunner = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const configDoc = await db.doc("system/config").get();
    const settings = configDoc.data() || {};
    // Fail closed on malformed operational configuration; keep each invocation bounded.
    const maxJobAttempts = Number.isSafeInteger(settings.maxJobAttempts) &&
      settings.maxJobAttempts >= 1 && settings.maxJobAttempts <= 10 ? settings.maxJobAttempts : 3;
    const leaseSeconds = Number.isSafeInteger(settings.leaseSeconds) &&
      settings.leaseSeconds >= 30 && settings.leaseSeconds <= 3600 ? settings.leaseSeconds : 300;
    const now = admin.firestore.Timestamp.now();
    const leaseExpiresAt = new admin.firestore.Timestamp(now.seconds + leaseSeconds, now.nanoseconds);
    const runnerId = context.eventId;

    const queuedJobsQuery = db.collection("jobs").where("state", "==", "queued")
      .orderBy("priority", "desc").orderBy("createdAt").limit(25);
    const expiredJobsQuery = db.collection("jobs").where("state", "==", "running")
      .where("leaseExpiresAt", "<", now).orderBy("priority", "desc").orderBy("createdAt").limit(25);
    const [queued, expired] = await Promise.all([queuedJobsQuery.get(), expiredJobsQuery.get()]);
    const candidates = [...queued.docs, ...expired.docs];

    for (const candidate of candidates) {
      const jobId = candidate.id;
      const jobRef = db.collection("jobs").doc(jobId);
      let activeClaim: { attempt: number; before: admin.firestore.DocumentData } | null = null;
      try {
        // Firestore retries this callback under contention. It must contain
        // transaction reads/writes ONLY, never external artifacts or audit events.
        const claim = await db.runTransaction(async (transaction) => {
          const latest = await transaction.get(jobRef);
          if (!latest.exists) return { kind: 'skipped' as const };
          const before = latest.data()!;
          const decision = inspectFallbackJobLease(before, now.toMillis(), maxJobAttempts);
          if (decision.kind === 'skip') return { kind: 'skipped' as const };
          if (decision.kind === 'exhausted') {
            transaction.update(jobRef, {
              state: 'failed',
              error: { message: 'Maximum attempts reached.' },
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { kind: 'exhausted' as const, before, attempt: decision.attempt };
          }
          const attempt = decision.attempt + 1;
          transaction.update(jobRef, {
            state: 'running', claimedBy: runnerId, leaseExpiresAt, attempt,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return { kind: 'claimed' as const, before, attempt };
        });

        if (claim.kind === 'skipped') continue;
        if (claim.kind === 'exhausted') {
          await logJobEvent(jobId, 'state_change', 'Job failed: Maximum attempts reached.');
          await writeAuditLog('system', 'job_failed', `jobs/${jobId}`, claim.before, { state: 'failed' });
          continue;
        }
        if (claim.kind !== 'claimed') continue;
        activeClaim = { attempt: claim.attempt, before: claim.before };
        await logJobEvent(jobId, 'state_change', `Job leased by runner ${runnerId}. Attempt ${claim.attempt}.`);
        const output = await processJob({ ...claim.before, id: jobId, attempt: claim.attempt });

        // Work can outlive its lease. Never mark a job successful after
        // cancellation, deletion or a second runner's newer claim.
        const applied = await db.runTransaction(async (transaction) => {
          const current = await transaction.get(jobRef);
          if (!current.exists) return false;
          if (!ownsFallbackJobLease(current.data(), runnerId, claim.attempt)) return false;
          transaction.update(jobRef, {
            state: 'succeeded', output, error: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return true;
        });
        if (!applied) continue;
        await logJobEvent(jobId, 'artifact', 'Fallback artifact generated.', output);
        await logJobEvent(jobId, 'state_change', 'Job succeeded in fallback mode.');
        await writeAuditLog('system', 'job_succeeded_fallback', `jobs/${jobId}`,
          claim.before, { ...claim.before, state: 'succeeded', output });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown job error';
        console.error(`Fallback job ${jobId} failed:`, error);
        if (!activeClaim) continue;
        try {
          // Failure updates must obey the SAME lease authority as success.
          // Retry keeps the job running with an expired lease, matching the
          // existing state machine (running -> queued is not an allowed edge).
          const applied = await db.runTransaction(async (transaction) => {
            const current = await transaction.get(jobRef);
            if (!current.exists) return false;
            if (!ownsFallbackJobLease(current.data(), runnerId, activeClaim!.attempt)) return false;
            const terminal = activeClaim!.attempt >= maxJobAttempts;
            transaction.update(jobRef, {
              ...(terminal ? { state: 'failed' } : { leaseExpiresAt: admin.firestore.Timestamp.now() }),
              error: { message }, updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return terminal ? 'failed' as const : 'retry' as const;
          });
          if (!applied) continue;
          await logJobEvent(jobId, 'log', `Fallback job error: ${message}`);
          if (applied === 'failed') {
            await logJobEvent(jobId, 'state_change', `Job failed after ${activeClaim.attempt} attempts.`);
            await writeAuditLog('system', 'job_failed', `jobs/${jobId}`,
              activeClaim.before, { state: 'failed', error: { message } });
          }
        } catch (settlementError) {
          console.error(`Cannot settle failed fallback job ${jobId}:`, settlementError);
        }
      }
    }
  });
