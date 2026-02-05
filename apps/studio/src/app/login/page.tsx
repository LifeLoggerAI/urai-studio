"use client";
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseAuth, requireAuth } from "@/lib/firebaseClient";

export default function LoginPage() {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login() {
    setErr(null);
    setBusy(true);
    try {
      const auth = requireAuth();
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();

      const r = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || "session_failed");
      }

      const url = new URL(window.location.href);
      const from = url.searchParams.get("from") || "/";
      window.location.href = from;
    } catch (e: any) {
      setErr(e?.message || "login_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Sign in</h1>
      <p>Sign in to access URAI Studio.</p>
      <button
        onClick={login}
        disabled={busy}
        style={{ padding: 12, borderRadius: 10, border: "1px solid #333" }}
      >
        {busy ? "Signing in..." : "Continue with Google"}
      </button>
      {err && <p style={{ color: "crimson", marginTop: 12 }}>{err}</p>}
    </main>
  );
}
