"use client";

import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import Link from "next/link";

import { StudioShell } from "@/src/components/studio/StudioShell";
import { JobStatePill } from "@/src/components/studio/JobStatePill";
import { auth, db } from "@/src/lib/firebaseClient";
import type { Job, Membership } from "@/src/lib/studioTypes";

function nowMs(){ return Date.now(); }

export default function StudioPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [studioId] = useState<string>("default");
  const [role, setRole] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [template, setTemplate] = useState("podcast");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUid(u?.uid ?? null);
      setErr(null);
      if (!u) { setRole(null); return; }

      const mid = `${u.uid}_${studioId}`;
      const mref = doc(db, "memberships", mid);
      const msnap = await getDoc(mref);
      if (!msnap.exists()) {
        const membership: Omit<Membership, "id"> = {
          uid: u.uid,
          studioId,
          role: "owner",
          createdAt: nowMs(),
        };
        await setDoc(mref, membership as any, { merge: true });
      }
      const msnap2 = await getDoc(mref);
      setRole((msnap2.data() as any)?.role ?? null);
    });
  }, [studioId]);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "jobs"),
      where("studioId", "==", studioId),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      const rows: Job[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setJobs(rows);
    });
  }, [uid, studioId]);

  const canUse = useMemo(() => !!uid && !!role, [uid, role]);

  async function signIn() {
    setErr(null);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function createJob() {
    if (!uid) return;
    setBusy(true); setErr(null);
    try {
      const clipRef = await addDoc(collection(db, "clipRequests"), {
        studioId,
        createdAt: nowMs(),
        createdBy: uid,
        prompt: prompt.trim(),
        template,
        createdAtServer: serverTimestamp(),
      });

      await addDoc(collection(db, "jobs"), {
        studioId,
        createdAt: nowMs(),
        createdBy: uid,
        clipRequestId: clipRef.id,
        state: "QUEUED",
        attempt: 0,
        renderProfile: "v1",
        createdAtServer: serverTimestamp(),
      });

      setPrompt("");
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function retryJob(jobId: string) {
    setBusy(true); setErr(null);
    try {
      const jref = doc(db, "jobs", jobId);
      await updateDoc(jref, {
        state: "QUEUED",
        attempt: (jobs.find(j => j.id === jobId)?.attempt ?? 0) + 1,
        lastError: null,
        retriedAt: nowMs(),
        retriedAtServer: serverTimestamp(),
      } as any);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <StudioShell title="Studio">
      {!uid ? (
        <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            Sign in to generate clips. (Friend Mode v1 uses Google sign-in.)
          </div>
          <button onClick={signIn} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff" }}>
            Sign in with Google
          </button>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Fill .env.local with NEXT_PUBLIC_FIREBASE_* first.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 10, maxWidth: 900, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>studioId: <b>{studioId}</b></div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>role: <b>{role ?? "unknown"}</b></div>
              <Link href={`/studio`} style={{ fontSize: 12, textDecoration: "underline" }}>refresh</Link>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Paste what you want. Example: 'Turn this into a 25s hype clip with captions + a clean thumbnail.'"
              rows={4}
              style={{ width: "100%", borderRadius: 12, padding: 10, border: "1px solid #d1d5db" }}
            />

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 12, opacity: 0.8 }}>
                Template{" "}
                <select value={template} onChange={(e) => setTemplate(e.target.value)} style={{ marginLeft: 8, padding: 6, borderRadius: 10 }}>
                  <option value="podcast">Podcast Clip</option>
                  <option value="quote">Quote + Voice</option>
                  <option value="talkinghead">Talking Head</option>
                </select>
              </label>

              <button
                disabled={!canUse || busy || prompt.trim().length < 6}
                onClick={createJob}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", opacity: (!canUse || busy || prompt.trim().length < 6) ? 0.5 : 1 }}
              >
                {busy ? "Working..." : "Generate"}
              </button>

              {err ? <div style={{ color: "#b91c1c", fontSize: 12 }}>{err}</div> : null}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Job Queue</h2>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              {jobs.length === 0 ? (
                <div style={{ padding: 12, fontSize: 13, opacity: 0.7 }}>No jobs yet. Create one above.</div>
              ) : (
                <div>
                  {jobs.map((j) => (
                    <div key={j.id} style={{ display: "grid", gridTemplateColumns: "140px 1fr 160px", gap: 10, padding: 12, borderTop: "1px solid #f3f4f6", alignItems: "center" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{new Date(j.createdAt).toLocaleString()}</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <JobStatePill state={j.state as any} />
                        <Link href={`/studio/job/${j.id}`} style={{ fontSize: 13, textDecoration: "underline" }}>
                          Open job
                        </Link>
                        <span style={{ fontSize: 12, opacity: 0.6 }}>attempt {j.attempt ?? 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => retryJob(j.id)}
                          disabled={busy}
                          style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff" }}
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Next: worker consumes QUEUED jobs and writes outputs + updates state.
            </div>
          </div>
        </div>
      )}
    </StudioShell>
  );
}
