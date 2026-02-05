"use client";

import { useEffect, useState } from "react";
import { listJobs } from "@/lib/firestoreStudio";

type JobRow = any;

export default function JobsClient() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const rows = await listJobs(50);
        if (alive) setJobs(Array.isArray(rows) ? rows : []);
      } catch (e: any) {
        if (alive) setErr(e?.message || "jobs_load_failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Studio Jobs</h1>

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {!loading && !err && (
        <ul style={{ marginTop: 12 }}>
          {jobs.map((j: any, i: number) => (
            <li key={j?.id || i} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ fontWeight: 600 }}>{j?.id || "(no id)"}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{String(j?.status || j?.state || "unknown")}</div>
            </li>
          ))}
          {jobs.length === 0 && <li>No jobs yet.</li>}
        </ul>
      )}
    </main>
  );
}
