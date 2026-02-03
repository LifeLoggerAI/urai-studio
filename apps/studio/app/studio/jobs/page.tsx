
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StudioJob } from "../../schemas";

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
    <div className="mt-2 w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
    </div>
);

export default function StudioJobsPage() {
  const [jobs, setJobs] = useState<StudioJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/jobs");
        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.statusText}`);
        }
        const data = await response.json();
        const toDate = (ts: any) => ts && ts._seconds ? new Date(ts._seconds * 1000) : null;
        setJobs(data.jobs.map((j: any) => ({ ...j, updatedAt: toDate(j.updatedAt) })));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="relative mx-auto max-w-[980px] px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="mt-1 text-sm text-zinc-600">Everything Studio has done or is doing.</p>
        </div>

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-zinc-300">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th scope="col" className="w-48 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 sm:pl-6">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">Job</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">Source</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">Last Update</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-8 text-zinc-500">Loading jobs...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={5} className="text-center py-8 text-rose-600">Error: {error}</td></tr>
                    ) : jobs.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-zinc-500">No jobs found.</td></tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.jobId}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                            <div>{statusBadge(job.status)}</div>
                            {(job.status === "ANALYZING" || job.status === "RENDERING" || job.status === "UPLOADING") && job.progress !== undefined && (
                              <ProgressBar progress={job.progress} />
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">{job.type}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">{job.source.title || job.source.ref}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">{job.updatedAt?.toLocaleTimeString()}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link href={`/studio/jobs/${job.jobId}`} className="text-indigo-600 hover:text-indigo-900">
                              {job.status === 'FAILED' ? 'Replay' : 'View'}
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex items-center justify-between text-xs text-zinc-500">
          <div>URAI Studio • v1</div>
          <div className="flex gap-4">
            <Link className="hover:text-zinc-900" href="/studio">Home</Link>
            <a className="hover:text-zinc-900" href="/studio/dlq">Dead letter</a>
            <a className="hover:text-zinc-900" href="/studio/settings">Settings</a>
          </div>
        </div>
      </div>
    </div>
  );
}
