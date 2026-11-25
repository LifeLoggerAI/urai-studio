"use client";
import { onIdTokenChanged, type User } from "firebase/auth";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebaseClient";

type Playback = { jobId: string; mimeType: "video/mp4"; url: string; expiresAt: string; subtitleText: string; publicReleaseAuthorized: false };
const JOB_ID = /^[A-Za-z0-9_-]{10,64}$/;
function validPlayback(value: unknown, id: string): value is Playback {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  if (p.jobId !== id || p.mimeType !== "video/mp4" || p.publicReleaseAuthorized !== false ||
    typeof p.url !== "string" || typeof p.expiresAt !== "string" || typeof p.subtitleText !== "string") return false;
  try {
    const url = new URL(p.url);
    const expiry = Date.parse(p.expiresAt);
    return url.protocol === "https:" && !url.username && !url.password && !url.hash &&
      (url.hostname === "storage.googleapis.com" || url.hostname.endsWith(".storage.googleapis.com")) &&
      expiry > Date.now() && expiry <= Date.now() + 305000 && p.subtitleText.length <= 2097152;
  } catch { return false; }
}
export default function ReplayClient() {
  const params = useParams();
  const jobId = typeof params?.replayId === "string" ? params.replayId : "";
  return <ReplaySession key={jobId} jobId={jobId} />;
}

function ReplaySession({ jobId }: { jobId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(!auth);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(auth
    ? "Sign in and request fresh owner authorization."
    : "Firebase authentication is unavailable.");
  const [media, setMedia] = useState<Playback | null>(null);
  const generation = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const owner = useRef<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    function invalidateRequest() {
      generation.current++;
      pending.current?.abort();
      pending.current = null;
    }
    const unsubscribe = onIdTokenChanged(auth, next => {
      invalidateRequest();
      owner.current = next?.uid ?? null;
      setUser(next); setInitialized(true); setLoading(false); setMedia(null);
      setMessage(next ? "Authorize playback of a completed private render." : "Sign in to access private Replay.");
    }, () => {
      invalidateRequest();
      owner.current = null;
      setUser(null); setLoading(false); setMedia(null); setInitialized(true);
      setMessage("Current authentication could not be verified.");
    });
    return () => { invalidateRequest(); unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!media) return;
    const remaining = Date.parse(media.expiresAt) - Date.now();
    const expire = () => { setMedia(null); setMessage("Access expired. Reauthorize before playback."); };
    if (remaining <= 0) { expire(); return; }
    const timer = setTimeout(expire, remaining);
    return () => clearTimeout(timer);
  }, [media]);

  useEffect(() => {
    const hide = () => {
      if (document.visibilityState !== "hidden") return;
      generation.current++; pending.current?.abort(); setMedia(null); setLoading(false);
      setMessage("Playback cleared while hidden. Request fresh authorization.");
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  async function requestPlayback() {
    if (!auth || !user || !JOB_ID.test(jobId) || loading) return;
    const uid = user.uid, epoch = ++generation.current;
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    // Bound token acquisition separately: aborting a controller does not cancel Firebase getIdToken().
    // Racing the abort signal guarantees the UI can leave its pending state.
    let timeout = setTimeout(() => controller.abort(), 15000);
    setLoading(true); setMedia(null); setMessage("Checking current owner and render authorization.");
    try {
      const token = await Promise.race([
        user.getIdToken(),
        new Promise<never>((_, reject) => {
          if (controller.signal.aborted) { reject(new Error("authorization-aborted")); return; }
          controller.signal.addEventListener("abort", () => reject(new Error("authorization-aborted")), { once: true });
        })
      ]);
      if (controller.signal.aborted || epoch !== generation.current || auth.currentUser?.uid !== uid || owner.current !== uid) return;
      clearTimeout(timeout);
      timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch("/api/studio/video-factory/jobs-playback?jobId=" + encodeURIComponent(jobId), {
        method: "GET", cache: "no-store", credentials: "same-origin", redirect: "error",
        headers: { authorization: "Bearer " + token, accept: "application/json" }, signal: controller.signal
      });
      const body: unknown = await response.json().catch(() => null);
      if (controller.signal.aborted || epoch !== generation.current || auth.currentUser?.uid !== uid || owner.current !== uid) return;
      const result = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
      if (!response.ok || result.ok !== true || !validPlayback(result.playback, jobId)) throw new Error("unavailable");
      setMedia(result.playback);
      setMessage("Private media authorized for this session; link expires shortly.");
    } catch {
      if (epoch !== generation.current) return;
      setMedia(null);
      setMessage(controller.signal.aborted
        ? "Authorization timed out. Retry to request fresh permission."
        : "Private Replay unavailable. No cached or demo media substituted.");
    } finally {
      clearTimeout(timeout);
      if (pending.current === controller) pending.current = null;
      if (epoch === generation.current) setLoading(false);
    }
  }
  return <section className="page-stack" data-testid="studio-governed-replay">
    <h1>Private Replay</h1>
    <p>Completed generated media is available only to its currently authorized owner.</p>
    <p role="status" aria-live="polite">{message}</p>
    <button type="button" className="button button-primary" disabled={!initialized || !user || !JOB_ID.test(jobId) || loading}
      onClick={requestPlayback}>{loading ? "Checking permission…" : "Authorize private playback"}</button>
    {media && <div data-testid="studio-authorized-video">
      <video key={media.url} src={media.url} controls playsInline preload="none" controlsList="nodownload"
        style={{ width: 800, maxWidth: "100%" }} aria-label="Owner-authorized generated Replay" />
      <p>Access expires at {new Date(media.expiresAt).toLocaleTimeString()}.</p>
    </div>}
  </section>;
}
