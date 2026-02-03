import { adminDb } from "@/lib/firebaseAdmin";

export type JobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "DLQ";
export type JobRow = {
  id: string;
  type?: string;
  status?: JobStatus | string;
  updatedAt?: string | null;
  createdAt?: string | null;
  attempts?: number | null;
  lastError?: string | null;
};

export type ListJobsParams = {
  q?: string;
  status?: string;      // "ALL" or exact
  limit?: number;       // 1..200
  cursor?: string;      // updatedAt ISO of last row (simple cursor)
};

function toIso(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v.toDate) return v.toDate().toISOString();
  return null;
}

export async function listJobs(params: ListJobsParams): Promise<{ rows: JobRow[]; nextCursor: string | null }> {
  const limit = Math.max(1, Math.min(200, params.limit || 50));
  const status = (params.status || "ALL").trim();
  const q = (params.q || "").trim().toLowerCase();
  const cursor = (params.cursor || "").trim();

  let ref: FirebaseFirestore.Query = adminDb.collection("jobs").orderBy("updatedAt", "desc").limit(limit);

  if (status && status !== "ALL") {
    ref = ref.where("status", "==", status);
  }

  // Simple cursor: if provided, startAfter updatedAt timestamp.
  // If your jobs.updatedAt is a Firestore Timestamp, we can startAfter a Timestamp by re-fetching last doc.
  // We'll do doc-based cursor when cursor is present by finding first doc with matching ISO.
  if (cursor) {
    // find doc by updatedAt == cursor (best-effort), else skip cursor
    const snap = await ref.get();
    const docs = snap.docs;
    const idx = docs.findIndex((d) => toIso((d.data() as any).updatedAt) === cursor);
    if (idx >= 0 && idx < docs.length - 1) {
      ref = ref.startAfter(docs[idx]).limit(limit);
    }
  }

  const snap = await ref.get();
  let rows = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      type: data.type,
      status: data.status,
      updatedAt: toIso(data.updatedAt),
      createdAt: toIso(data.createdAt),
      attempts: data.attempts ?? null,
      lastError: data.lastError ?? null
    } satisfies JobRow;
  });

  if (q) {
    rows = rows.filter((r) =>
      r.id.toLowerCase().includes(q) ||
      String(r.type || "").toLowerCase().includes(q) ||
      String(r.status || "").toLowerCase().includes(q) ||
      String(r.lastError || "").toLowerCase().includes(q)
    );
  }

  const nextCursor = rows.length ? (rows[rows.length - 1].updatedAt || null) : null;
  return { rows, nextCursor };
}
