'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

type QueueState = 'idle' | 'queueing' | 'draft' | 'contract-only' | 'failed';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

// Keep server-rendered queue actions disabled until React owns their handlers.
const subscribeToReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function QueueReplayTeaserButton({ templateId, prompt }: { templateId: string; prompt: string }) {
  const [state, setState] = useState<QueueState>('idle');
  const [message, setMessage] = useState('Create a Replay Teaser draft. Rendering and provider execution are not enabled.');
  const inFlight = useRef(false);
  // Reuse the same key after a timed-out/lost response for this exact payload.
  const pendingDraft = useRef<{ body: string; key: string } | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const ready = useSyncExternalStore(subscribeToReady, clientReady, serverReady);

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function queueReplayTeaser() {
    if (inFlight.current) return;
    inFlight.current = true;
    const controller = new AbortController();
    activeRequest.current = controller;
    const timer = setTimeout(() => controller.abort(), 15_000);
    const body = JSON.stringify({ templateId, prompt });
    if (!pendingDraft.current || pendingDraft.current.body !== body) {
      pendingDraft.current = { body, key: crypto.randomUUID() };
    }
    const idempotencyKey = pendingDraft.current.key;
    setState('queueing');
    setMessage('Saving Replay Teaser draft...');

    try {
      const response = await fetch('/api/studio/video-factory/', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-urai-studio-idempotency-key': idempotencyKey },
        body,
        cache: 'no-store',
        signal: controller.signal,
      });
      const payload = record(await response.json().catch(() => ({})));
      const data = record(payload.data);
      if (controller.signal.aborted) throw new Error('Draft request timed out. Check saved drafts before retrying.');

      if (!response.ok) {
        throw new Error(response.status === 401
          ? 'Sign in to Studio before saving this draft.'
          : 'Studio storage is unavailable. No draft was confirmed.');
      }

      if (payload.ok === true && payload.persisted === false && data.contractOnly === true) {
        setState('contract-only');
        setMessage('Replay Teaser contract validated. No draft was persisted because the Studio store is unavailable.');
        return;
      }

      if (payload.ok !== true || payload.persisted !== true || payload.status !== 'draft'
        || typeof data.id !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(data.id)) {
        throw new Error('Studio returned an incomplete draft receipt. Check saved drafts before retrying.');
      }

      const execution = record(payload.execution);
      if (data.status !== 'draft' || execution.mode !== 'contract-only'
        || execution.workerDispatched !== false || execution.outputVerified !== false
        || execution.mediaRendered !== false || execution.privateRenderConsentAuthorized !== false) {
        throw new Error('Studio returned an unverified execution receipt. No render is confirmed.');
      }
      pendingDraft.current = null;
      setState('draft');
      setMessage(`Saved Replay Teaser draft: ${data.id}. No renderer or provider was dispatched.`);
    } catch (error) {
      setState('failed');
      setMessage(controller.signal.aborted
        ? 'Draft request timed out. Check saved drafts before retrying.'
        : error instanceof Error ? error.message : 'Draft save failed.');
    } finally {
      clearTimeout(timer);
      activeRequest.current = null;
      inFlight.current = false;
    }
  }

  return (
    <div className={`card status-${state === 'failed' ? 'error' : 'info'}`} data-video-factory-queue="replay-teaser">
      <p className="eyebrow">Draft action</p>
      <h3>Save Replay Teaser Draft</h3>
      <p role="status" aria-live="polite" aria-atomic="true">{message}</p>
      <button className="button button-primary" type="button" onClick={queueReplayTeaser} disabled={!ready || state === 'queueing'}>
        {state === 'queueing' ? 'Saving...' : 'Save Replay Teaser Draft'}
      </button>
    </div>
  );
}
