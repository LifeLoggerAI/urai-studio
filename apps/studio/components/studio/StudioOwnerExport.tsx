'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth } from '@/lib/firebaseClient';
import { downloadStudioDataExport } from '@/lib/studio-export-download-client';

export function StudioOwnerExport() {
  const [owner, setOwner] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const operation = useRef<symbol | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, user => {
      operation.current = null;
      setOwner(user);
      setBusy(false);
      setMessage('');
    });
    return () => { operation.current = null; unsubscribe(); };
  }, []);

  async function exportRecords() {
    if (!app || !owner || auth?.currentUser !== owner || operation.current) return;
    const ticket = Symbol();
    operation.current = ticket;
    const isCurrent = () => operation.current === ticket && auth?.currentUser === owner;
    setBusy(true);
    setMessage('Preparing your export…');
    try {
      const create = httpsCallable<Record<string, never>, { ok: boolean; status: string; requestId: string }>(getFunctions(app), 'requestStudioDataExport');
      const { data } = await create({});
      if (!isCurrent()) return;
      if (data.ok !== true || data.status !== 'ready' || typeof data.requestId !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(data.requestId)) throw new Error();
      const blob = await downloadStudioDataExport(data.requestId);
      if (!isCurrent()) return;
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'urai-studio-export.json';
        link.click();
        setMessage('Your download has started.');
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      if (isCurrent()) setMessage('Download unavailable. Check your sign-in and export consent, then try again.');
    } finally {
      if (isCurrent()) { operation.current = null; setBusy(false); }
    }
  }

  return (
    <section className="section-panel" aria-labelledby="studio-owner-export-title">
      <h2 id="studio-owner-export-title">Your Studio data</h2>
      {!app ? <p>Account downloads are unavailable in this environment.</p> : !owner ? <Link href="/login">Sign in to export your Studio data</Link> : <>
        <p>Your export contains your Studio records. Downloading requires current export consent.</p>
        <button type="button" className="button" disabled={busy} onClick={exportRecords}>Download my Studio data</button>
      </>}
      <p role="status" aria-live="polite">{message}</p>
    </section>
  );
}
