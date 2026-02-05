
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StudioJob } from "../schemas";

const statusDot = (online: boolean) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
    <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-zinc-400"}`} />
    {online ? "Studio online" : "Studio offline"}
  </span>
);

const badge = (state: StudioJob["status"]) => {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
  if (state === "SUCCEEDED") return <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>Clip created</span>;
  if (state === "ANALYZING" || state === "RENDERING" || state === "UPLOADING") return <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>Making a clip</span>;
  if (state === "FAILED") return <span className={`${base} border-rose-200 bg-rose-50 text-rose-700`}>Needs attention</span>;
  return <span className={`${base} border-zinc-200 bg-zinc-50 text-zinc-700`}>{state}</span>;
};

const JobCreationModal = ({ isOpen, onClose, setJobs }: { isOpen: boolean; onClose: () => void; setJobs: React.Dispatch<React.SetStateAction<StudioJob[]>> }) => {
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!prompt) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        throw new Error("Failed to create job");
      }
      const newJob = await response.json();
      setJobs(prevJobs => [newJob, ...prevJobs]);
      onClose();
    } catch (error) {
      console.error(error);
      alert("There was an error creating the job.");
    } finally {
      setIsCreating(false);
      setPrompt("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-xl font-semibold">Make a new clip</h2>
        <p className="mt-1 text-sm text-zinc-400">Describe the clip you want to create. This will create a new job.</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-white"
          placeholder="e.g., a clip about the turning point in my conversation with Mike"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800">Cancel</button>
          <button onClick={handleCreate} disabled={isCreating} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:opacity-90 disabled:opacity-50">
            {isCreating ? "Creating..." : "Create Job"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function StudioFriendHome() {
  const [jobs, setJobs] = useState<StudioJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("/api/jobs");
        const data = await res.json();
        const toDate = (ts: any) => ts && ts._seconds ? new Date(ts._seconds * 1000) : new Date();
        setJobs(data.jobs.map((j: any) => ({ ...j, createdAt: toDate(j.createdAt) })));
      } catch (e) {
        console.error("Failed to fetch jobs for live feed:", e);
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
       <JobCreationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} setJobs={setJobs} />
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-500/20 via-fuchsia-500/10 to-transparent blur-3xl" />
        <div className="absolute bottom-[-25%] left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-t from-emerald-500/10 via-sky-500/5 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[980px] px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <div className="text-lg font-semibold tracking-tight">URAI Studio</div>
            <div className="text-xs text-zinc-400">Your clips are made here.</div>
          </div>
          <div className="flex items-center gap-3">
            {statusDot(true)}
            <div className="text-xs text-zinc-400">Last run: just now</div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
          <div className="max-w-[640px]">
            <div className="text-3xl font-semibold leading-tight tracking-tight">Create clips from real moments.</div>
            <div className="mt-3 text-sm text-zinc-300">URAI finds highlights and turns them into ready-to-post shorts.</div>
            <div className="mt-6 flex items-center gap-4">
              <button onClick={() => setIsModalOpen(true)} className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow hover:opacity-95 active:opacity-90">Make clips automatically</button>
              <Link className="text-sm text-zinc-300 hover:text-white underline underline-offset-4" href="/studio/jobs">Advanced controls →</Link>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">What’s happening</div>
              <div className="text-xs text-zinc-500">Live activity</div>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="text-sm text-zinc-400">Loading activity...</div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 text-sm text-zinc-500">No activity yet. Your automated clips will appear here.</div>
              ) : (
                jobs.map((job) => (
                  <Link key={job.jobId} href={`/studio/jobs/${job.jobId}`} className="block rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 hover:bg-zinc-900/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          {badge(job.status)}
                          <div className="truncate text-sm font-medium">{job.type.replace(/_/g, ' ')}</div>
                          <div className="ml-auto shrink-0 text-xs text-zinc-500">{(((job as any).createdAt?.toDate?.() ? (job as any).createdAt.toDate().toLocaleTimeString() : String((job as any).createdAt ?? "")))}</div>
                        </div>
                        <div className="mt-1 truncate text-xs text-zinc-400">{job.source.title || job.source.ref}</div>
                      </div>
                      <button className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900">Details</button>
                    </div>
                  </Link>
                ))
              )}
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
