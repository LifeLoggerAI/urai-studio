"use client";

import React, { useEffect, useState } from "react";
import { doc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore";
import Link from "next/link";

import { StudioShell } from "@/src/components/studio/StudioShell";
import { JobStatePill } from "@/src/components/studio/JobStatePill";
import { db } from "@/src/lib/firebaseClient";
import type { Job, Output } from "@/src/lib/studioTypes";

export default function JobDetailPage({ params }: { params: { jobId: string } }) {
  const jobId = params.jobId;
  const [job, setJob] = useState<Job | null>(null);
  const [outputs, setOutputs] = useState<Output[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "jobs", jobId), (snap) => {
      if (!snap.exists()) { setJob(null); return; }
      setJob({ id: snap.id, ...(snap.data() as any) });
    });
    return () => unsub();
  }, [jobId]);

  useEffect(() => {
    if (!job?.studioId) return;
    const q = query(
      collection(db, "outputs"),
      where("studioId", "==", job.studioId),
      where("jobId", "==", jobId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows: Output[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setOutputs(rows);
    });
    return () => unsub();
  }, [job?.studioId, jobId]);

  return (
    <StudioShell title="Job Detail">
      <div style={{ display: "grid", gap: 12 }}>
        <Link href="/studio" style={{ textDecoration: "underline", fontSize: 13 }}>← Back to Studio</Link>

        {!job ? (
          <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
            Job not found (or you don't have access).
          </div>
        ) : (
          <>
            <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <JobStatePill state={job.state as any} />
                <div style={{ fontSize: 12, opacity: 0.7 }}>jobId: <code>{job.id}</code></div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>studioId: <code>{job.studioId}</code></div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>attempt: <b>{job.attempt ?? 0}</b></div>
              </div>

              {job.lastError ? (
                <div style={{ padding: 10, borderRadius: 12, background: "#fff7ed", border: "1px solid #fed7aa" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Last error</div>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>{job.lastError}</pre>
                </div>
              ) : null}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>Outputs</h2>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                {outputs.length === 0 ? (
                  <div style={{ padding: 12, fontSize: 13, opacity: 0.7 }}>
                    No outputs yet. Worker should write Output docs + Storage files when done.
                  </div>
                ) : (
                  outputs.map(o => (
                    <div key={o.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10, padding: 12, borderTop: "1px solid #f3f4f6" }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{o.kind}</div>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        <div><code>{o.storagePath}</code></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </StudioShell>
  );
}
