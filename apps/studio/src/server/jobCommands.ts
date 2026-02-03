import { adminDb } from "@/lib/firebaseAdmin";

export type ReplayKind = "REPLAY" | "DLQ_REPLAY";

export async function requestReplay(jobId: string, kind: ReplayKind, actor: string, reason?: string) {
  const now = new Date();
  const commandId = `${kind}:${jobId}`; // idempotent key
  const ref = adminDb.collection("jobCommands").doc(commandId);

  await adminDb.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      // idempotent: don't create duplicates
      return;
    }
    tx.set(ref, {
      kind,
      jobId,
      actor,
      reason: reason || null,
      createdAt: now,
      status: "REQUESTED"
    });

    // also write an audit event
    tx.set(adminDb.collection("auditLogs").doc(), {
      at: now,
      action: kind,
      jobId,
      actor,
      reason: reason || null,
      source: "studio"
    });

    // optionally bump job doc with a marker (safe/no-op if missing)
    tx.set(
      adminDb.collection("jobs").doc(jobId),
      {
        lastCommand: { kind, at: now, actor, reason: reason || null }
      },
      { merge: true }
    );
  });

  return { ok: true, commandId };
}
