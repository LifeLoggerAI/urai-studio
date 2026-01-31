'use client';

import React from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirebase } from "@/lib/firebaseClient";
import ProgressBar from "@/components/ProgressBar";
import Auth from "@/components/Auth";

type JobDoc = {
  status?: "queued" | "running" | "succeeded" | "failed";
  progress?: { stage?: string; pct?: number; t?: number };
  outputs?: any;
  error?: { message?: string; details?: string };
};

const targets = [
  { id: "shorts", label: "Shorts/Reels" },
  { id: "youtube", label: "YouTube" },
  { id: "ads", label: "Ads" }
] as const;

export default function Home() {
  const [target, setTarget] = React.useState<(typeof targets)[number]["id"]>("shorts");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [job, setJob] = React.useState<JobDoc | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (!jobId) return;
    const { db } = getFirebase();
    const unsub = onSnapshot(doc(db, "jobs", jobId), (snap) => {
      setJob((snap.data() as any) ?? null);
    });
    return () => unsub();
  }, [jobId]);

  async function handleUpload() {
    const { storage } = getFirebase();
    const uploadedFiles: { kind: 'video' | 'image'; name: string; size: number; }[] = [];

    const uploadPromises = files.map((file) => {
      const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          },
          (error) => {
            console.error("Upload failed for", file.name, error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            uploadedFiles.push({
              kind: file.type.startsWith('video') ? 'video' : 'image',
              name: downloadURL,
              size: file.size,
            });
            resolve();
          }
        );
      });
    });

    await Promise.all(uploadPromises);
    return uploadedFiles;
  }

  async function generate() {
    setBusy(true);
    setJob(null);
    setJobId(null);

    try {
      const uploadedMedia = await handleUpload();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "auto",
          target,
          media: uploadedMedia,
        })
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "generate failed");
      setJobId(j.jobId);
    } catch (e: any) {
      setJob({ status: "failed", error: { message: "Generate failed", details: String(e?.message ?? e) } });
    } finally {
      setBusy(false);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
      setUploadProgress({});
    }
  };

  const status = job?.status ?? (jobId ? "queued" : "idle");
  const pct = job?.progress?.pct ?? (jobId ? 1 : 0);
  const stage = job?.progress?.stage ?? (jobId ? "queued" : "ready");

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="text-xs tracking-[0.2em] text-zinc-400">URAI.STUDIO</div>
            <h1 className="mt-2 text-3xl font-semibold">Auto Content Factory</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Drop media. Click Generate. Get a complete content pack — automatically.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 shadow">
              <div className="text-xs text-zinc-400">Mode</div>
              <div className="text-sm font-medium">AUTO</div>
            </div>
            <Auth />
          </div>
        </div>

        <div className="mt-10 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-zinc-400">Target</span>
            <div className="flex gap-2">
              {targets.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTarget(t.id)}
                  className={[
                    "rounded-xl px-3 py-2 text-sm border transition",
                    target === t.id
                      ? "border-white/40 bg-white/10"
                      : "border-zinc-800 bg-black/30 hover:border-zinc-600"
                  ].join(" ")}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={generate}
                disabled={busy || files.length === 0}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-medium border transition",
                  (busy || files.length === 0) ? "opacity-60 cursor-not-allowed" : "hover:border-zinc-500",
                  "border-zinc-700 bg-white/10"
                ].join(" ")}
              >
                {busy ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="file-upload" className="block text-sm font-medium text-zinc-400 mb-2">
              Upload Media
            </label>
            <div className="flex justify-center rounded-lg border border-dashed border-zinc-700 px-6 py-10">
              <div className="text-center">
                <div className="mt-4 flex text-sm leading-6 text-zinc-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-zinc-900 font-semibold text-white focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900 hover:text-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-zinc-500">MP4, MOV, PNG, JPG, GIF up to 1GB</p>
              </div>
            </div>
            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-zinc-300">Selected Files:</h3>
                <ul className="mt-2 space-y-2">
                  {files.map(file => (
                    <li key={file.name} className="text-sm text-zinc-400">
                      <div className="flex items-center justify-between">
                        <span>{file.name}</span>
                        <span className="text-xs text-zinc-500">{Math.round(uploadProgress[file.name] || 0)}%</span>
                      </div>
                      <ProgressBar progress={uploadProgress[file.name] || 0} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400">Status</div>
                <div className="text-sm font-medium">{String(status).toUpperCase()}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-400">Stage</div>
                <div className="text-sm font-medium">{stage}</div>
              </div>
            </div>

            <div className="mt-3 h-2 w-full rounded-full bg-zinc-900">
              <div
                className="h-2 rounded-full bg-white/70 transition-all"
                style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
              />
            </div>

            {jobId && (
              <div className="mt-3 text-xs text-zinc-500 break-all">
                Job ID: <span className="text-zinc-300">{jobId}</span>
              </div>
            )}
          </div>

          {job?.status === "failed" && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="text-sm font-semibold">Failed</div>
              <div className="mt-1 text-xs text-zinc-200">{job?.error?.message}</div>
              <div className="mt-1 text-xs text-zinc-400 whitespace-pre-wrap">{job?.error?.details}</div>
            </div>
          )}

          {job?.status === "succeeded" && job.outputs && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="text-sm font-semibold">Content Pack Ready</div>
              <div className="mt-4 space-y-4">
                {job.outputs.meta?.title && (
                  <div>
                    <h3 className="text-lg font-medium">Generated Title</h3>
                    <p className="mt-1 text-zinc-300">{job.outputs.meta.title}</p>
                  </div>
                )}
                {job.outputs.thumbnails?.[0]?.url && (
                  <div>
                    <h3 className="text-lg font-medium">Generated Thumbnail</h3>
                    <img
                      src={job.outputs.thumbnails[0].url}
                      alt="Generated thumbnail"
                      className="mt-2 rounded-lg border border-zinc-700 max-w-sm"
                    />
                  </div>
                )}
                {job.outputs.subtitles?.[0]?.content && (
                  <div>
                    <h3 className="text-lg font-medium">Generated Transcription</h3>
                    <p className="mt-1 text-zinc-300 whitespace-pre-wrap">{job.outputs.subtitles[0].content}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
   );
}
