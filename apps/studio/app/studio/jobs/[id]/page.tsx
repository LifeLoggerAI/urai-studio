
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StudioJob, StudioAudit } from "../../../schemas";

// Re-using the status badge and progress bar components from the jobs list page.
const statusBadge = (status: StudioJob["status"]) => {
    const base = "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium";
    const dot = (color: string) => <span className={`h-2 w-2 rounded-full ${color}`}></span>;
    switch (status) {
        case "SUCCEEDED": return <span className={`${base} bg-emerald-100 text-emerald-800`}>{dot("bg-emerald-500")}Succeeded</span>;
        case "ANALYZING": return <span className={`${base} bg-sky-100 text-sky-800`}>{dot("bg-sky-500")}Analyzing</span>;
        case "RENDERING": return <span className={`${base} bg-indigo-100 text-indigo-800`}>{dot("bg-indigo-500")}Rendering</span>;
        case "UPLOADING": return <span className={`${base} bg-amber-100 text-amber-800`}>{dot("bg-amber-500")}Uploading</span>;
        case "FAILED": return <span className={`${base} bg-rose-100 text-rose-800`}>{dot("bg-rose-500")}Failed</span>;
        case "QUEUED": return <span className={`${base} bg-zinc-100 text-zinc-800`}>{dot("bg-zinc-500")}Queued</span>;
        default: return <span className={`${base} bg-zinc-100 text-zinc-800`}>{dot("bg-zinc-500")}Unknown</span>;
    }
};

const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="mt-2 w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
    </div>
);

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<StudioJob | null>(null);
  const [auditLogs, setAuditLogs] = useState<StudioAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch job: ${response.statusText}`);
        }
        const data = await response.json();
        // Firestore Timestamps need to be converted to JS Dates
        const toDate = (ts: any) => ts && ts._seconds ? new Date(ts._seconds * 1000) : null;
        setJob({ 
          ...data.job, 
          createdAt: toDate(data.job.createdAt), 
          updatedAt: toDate(data.job.updatedAt),
          lastError: data.job.lastError ? { ...data.job.lastError, at: toDate(data.job.lastError.at) } : null,
        });
        setAuditLogs(data.auditLogs.map((log: any) => ({...log, at: toDate(log.at)})));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

  const handleReplay = async () => {
    setIsReplaying(true);
    try {
        const response = await fetch("/api/jobs/replay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId }),
        });
        if (!response.ok) {
            throw new Error("Failed to trigger replay.");
        }
        alert("Job has been re-queued for replay!");
        // Optionally, refetch data or redirect
        window.location.reload();
    } catch (err: any) {
        alert(`Error: ${err.message}`);
    } finally {
        setIsReplaying(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-rose-600">Error: {error}</div>;
  if (!job) return <div className="flex justify-center items-center min-h-screen">Job not found.</div>

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="relative mx-auto max-w-[980px] px-6 py-10">
        <a href="/studio/jobs" className="text-sm text-indigo-600 hover:text-indigo-900">← Back to all jobs</a>
        <div className="mt-4">
          <h1 className="text-2xl font-semibold">Job Details</h1>
          <p className="mt-1 text-sm text-zinc-600">Inspecting job: <span className="font-mono bg-zinc-200 p-1 rounded">{job.jobId}</span></p>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow ring-1 ring-black ring-opacity-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                  <h3 className="text-sm font-medium text-zinc-500">Status</h3>
                  <div className="mt-2">{statusBadge(job.status)}</div>
                  {job.progress !== undefined && job.status !== 'SUCCEEDED' && job.status !== 'FAILED' && <ProgressBar progress={job.progress} />}
              </div>
              <div><h3 className="text-sm font-medium text-zinc-500">Job Type</h3><p className="mt-1 text-sm font-semibold">{job.type}</p></div>
              <div><h3 className="text-sm font-medium text-zinc-500">Source</h3><p className="mt-1 text-sm text-zinc-700">{job.source.title || job.source.ref}</p></div>
              <div><h3 className="text-sm font-medium text-zinc-500">Attempts</h3><p className="mt-1 text-sm text-zinc-700">{job.attempts} / {job.maxAttempts}</p></div>
              <div><h3 className="text-sm font-medium text-zinc-500">Created At</h3><p className="mt-1 text-sm text-zinc-700">{job.createdAt?.toLocaleString()}</p></div>
              <div><h3 className="text-sm font-medium text-zinc-500">Last Updated</h3><p className="mt-1 text-sm text-zinc-700">{job.updatedAt?.toLocaleString()}</p></div>
              {job.lastError && (
                  <div className="md:col-span-3">
                      <h3 className="text-sm font-medium text-rose-600">Last Error (at {job.lastError.at?.toLocaleString()})</h3>
                      <p className="mt-1 text-sm text-rose-800 font-mono bg-rose-50 p-2 rounded">{job.lastError.message}</p>
                  </div>
              )}
          </div>
          {job.status === 'FAILED' && (
            <div className="mt-6 flex gap-4">
              <button onClick={handleReplay} disabled={isReplaying} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700 disabled:bg-indigo-400">
                {isReplaying ? 'Replaying...' : 'Replay Job'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-10">
            <h2 className="text-xl font-semibold">Audit Trail</h2>
            <div className="mt-4 flow-root">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-zinc-300">
                      <thead className="bg-zinc-50">
                          <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 sm:pl-6">Action</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">Timestamp</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">Actor</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 bg-white">
                          {auditLogs.map((log) => (
                              <tr key={log.auditId}>
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-zinc-900 sm:pl-6">{log.action}</td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">{log.at?.toLocaleString()}</td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 font-mono">{log.actor.uid}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            </div>
        </div>

        <div className="mt-12 flex items-center justify-between text-xs text-zinc-500">
          <div>URAI Studio • v1</div>
        </div>
      </div>
    </div>
  );
}
