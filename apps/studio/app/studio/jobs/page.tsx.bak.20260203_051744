"use client";

import { useEffect, useMemo, useState } from "react";

type JobRow = {
  id: string;
  type?: string;
  status?: string;
  updatedAt?: string | null;
  createdAt?: string | null;
  attempts?: number | null;
  lastError?: string | null;
};

function Badge({ s }: { s: string }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  if (s === "RUNNING") return <span className={base + " bg-blue-100 text-blue-900"}>RUNNING</span>;
  if (s === "QUEUED") return <span className={base + " bg-neutral-100 text-neutral-800"}>QUEUED</span>;
  if (s === "SUCCEEDED") return <span className={base + " bg-green-100 text-green-900"}>SUCCEEDED</span>;
  if (s === "FAILED") return <span className={base + " bg-red-100 text-red-900"}>FAILED</span>;
  if (s === "DLQ") return <span className={base + " bg-amber-100 text-amber-900"}>DLQ</span>;
  return <span className={base + " bg-neutral-100 text-neutral-800"}>{s}</span>;
}

async function postJSON(path: string, body: any) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `HTTP_${res.status}`);
  return json;
}

export default function JobsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [rows, setRows] = useState<JobRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const header = useMemo(() => {
    return {
      title: "Jobs",
      subtitle:
        "Live Firestore queue view. This page reads jobs via server Admin SDK (no client Firestore)."
    };
  }, []);

  async function load(opts?: { cursor?: string; reset?: boolean }) {
    setLoading(true);
    setErr(null);
    try {
      const limit = 50;
      const cursor = opts?.cursor || "";
      const url = `/api/jobs/list?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&limit=${limit}&cursor=${encodeURIComponent(cursor)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "load_failed");
      setRows(json.rows || []);
      setNextCursor(json.nextCursor || null);

      if (opts?.reset) {
        setCursorStack([]);
      }
    } catch (e: any) {
      setErr(e?.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSearch() {
    await load({ reset: true });
  }

  async function replay(jobId: string) {
    await postJSON("/api/jobs/replay", { jobId, reason: "studio_replay" });
    await load();
  }

  async function dlqReplay(jobId: string) {
    await postJSON("/api/jobs/dlq-replay", { jobId, reason: "studio_dlq_replay" });
    await load();
  }

  async function nextPage() {
    if (!nextCursor) return;
    setCursorStack((s) => [...s, rows.length ? (rows[rows.length - 1].updatedAt || "") : ""]);
    await load({ cursor: nextCursor });
  }

  async function prevPage() {
    const copy = [...cursorStack];
    const prev = copy.pop();
    setCursorStack(copy);
    await load({ cursor: prev || "", reset: false });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-4xl font-extrabold tracking-tight">{header.title}</div>
        <div className="mt-2 text-sm text-neutral-600">{header.subtitle}</div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="h-10 w-[320px] rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
          placeholder="Search job id / type / status / error…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="h-10 rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="QUEUED">QUEUED</option>
          <option value="RUNNING">RUNNING</option>
          <option value="SUCCEEDED">SUCCEEDED</option>
          <option value="FAILED">FAILED</option>
          <option value="DLQ">DLQ</option>
        </select>

        <button
          onClick={onSearch}
          className="h-10 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold shadow-sm hover:shadow-md"
        >
          Apply
        </button>

        <button
          onClick={() => load()}
          className="h-10 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold shadow-sm hover:shadow-md"
        >
          Refresh
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            disabled={cursorStack.length === 0 || loading}
            onClick={prevPage}
            className="h-10 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50"
          >
            ← Prev
          </button>
          <button
            disabled={!nextCursor || loading}
            onClick={nextPage}
            className="h-10 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr_0.8fr_2fr_1.2fr] gap-0 border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-xs font-semibold text-neutral-700">
          <div>Job</div>
          <div>Type</div>
          <div>Status</div>
          <div>Updated</div>
          <div>Attempts</div>
          <div>Last error</div>
          <div className="text-right">Actions</div>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-sm text-neutral-600">Loading…</div>
        ) : err ? (
          <div className="px-5 py-6 text-sm text-red-700">Error: {err}</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-6 text-sm text-neutral-600">No jobs found.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {rows.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr_0.8fr_2fr_1.2fr] items-center gap-0 px-5 py-4 text-sm"
              >
                <div className="truncate font-mono text-xs">{r.id}</div>
                <div className="truncate">{r.type || "—"}</div>
                <div>{r.status ? <Badge s={r.status} /> : "—"}</div>
                <div className="text-xs text-neutral-600">
                  {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}
                </div>
                <div className="text-center">{r.attempts ?? "—"}</div>
                <div className="truncate text-xs text-neutral-700">{r.lastError || "—"}</div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => replay(r.id)}
                    className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold hover:shadow-sm"
                  >
                    Replay
                  </button>
                  <button
                    onClick={() => dlqReplay(r.id)}
                    className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold hover:shadow-sm"
                  >
                    DLQ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-neutral-500">
        Tip: If your Firestore has no jobs yet, you’ll see an empty table. That’s OK.
      </div>
    </div>
  );
}
