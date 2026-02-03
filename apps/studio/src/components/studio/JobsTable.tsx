"use client";

export type StudioJobRow = {
  id: string;
  type: string;
  status: string;
  updatedAt: string;
  attempts: number;
  lastError?: string;
};

function Badge({ s }: { s: string }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  if (s === "RUNNING") return <span className={base + " bg-blue-100 text-blue-900"}>RUNNING</span>;
  if (s === "QUEUED") return <span className={base + " bg-neutral-100 text-neutral-900"}>QUEUED</span>;
  if (s === "SUCCEEDED") return <span className={base + " bg-green-100 text-green-900"}>SUCCEEDED</span>;
  if (s === "FAILED") return <span className={base + " bg-red-100 text-red-900"}>FAILED</span>;
  if (s === "DLQ") return <span className={base + " bg-amber-100 text-amber-900"}>DLQ</span>;
  return <span className={base + " bg-neutral-100 text-neutral-900"}>{s}</span>;
}

export function JobsTable({
  rows,
  onReplay,
}: {
  rows: StudioJobRow[];
  onReplay: (jobId: string) => Promise<void>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="flex items-center justify-end gap-2 border-b p-3">
        <button
          onClick={() => alert("DLQ Replay wiring next (deadLetters -> requeue).")}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
        >
          DLQ Replay
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Job</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold">Attempts</th>
              <th className="px-4 py-3 font-semibold">Last error</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                <td className="px-4 py-3">{r.type}</td>
                <td className="px-4 py-3">
                  <Badge s={r.status} />
                </td>
                <td className="px-4 py-3">{r.updatedAt}</td>
                <td className="px-4 py-3">{r.attempts}</td>
                <td className="px-4 py-3 text-neutral-600">{r.lastError || "—"}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onReplay(r.id)}
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    Replay
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-4 py-6 text-neutral-500" colSpan={7}>
                  No jobs found. (Create a doc in Firestore collection <code className="font-mono">jobs</code> to see it
                  show up.)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
