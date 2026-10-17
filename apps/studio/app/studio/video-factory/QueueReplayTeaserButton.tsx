'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

type QueueState = 'idle' | 'queueing' | 'queued' | 'contract-only' | 'failed';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

// Keep server-rendered queue actions disabled until React owns their handlers.
const subscribeToReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function QueueReplayTeaserButton({ templateId, prompt }: { templateId: string; prompt: string }) {
  const [state, setState] = useState<QueueState>('idle');
  const [message, setMessage] = useState('Ready to queue the Replay Teaser through the existing Studio job API.');
  const inFlight = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  const ready = useSyncExternalStore(subscribeToReady, clientReady, serverReady);

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function queueReplayTeaser() {
    if (inFlight.current) return;
    inFlight.current = true;
    const controller = new AbortController();
    activeRequest.current = controller;
    const timer = setTimeout(() => controller.abort(), 15_000);
    setState('queueing');
    setMessage('Queueing Replay Teaser job...');

    try {
      const response = await fetch('/api/studio/video-factory/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templateId, prompt }),
        cache: 'no-store',
        signal: controller.signal,
      });
      const payload = record(await response.json().catch(() => ({})));
      const data = record(payload.data);
      if (controller.signal.aborted) throw new Error('Queue request timed out. Check job status before retrying.');

      if (!response.ok) {
        throw new Error(response.status === 401
          ? 'Sign in to Studio before queueing this job.'
          : 'Studio queueing is unavailable. No queued job was confirmed.');
      }

      if (payload.ok === true && payload.persisted === false && data.contractOnly === true) {
        setState('contract-only');
        setMessage('Replay Teaser contract validated. No job was queued because the Studio store is unavailable.');
        return;
      }

      if (payload.ok !== true || payload.persisted !== true || payload.status !== 'queued'
        || typeof data.id !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(data.id)) {
        throw new Error('Studio returned an incomplete queue receipt. Check job status before retrying.');
      }

      setState('queued');
      setMessage(`Queued Replay Teaser job: ${data.id}`);
    } catch (error) {
      setState('failed');
      setMessage(controller.signal.aborted
        ? 'Queue request timed out. Check job status before retrying.'
        : error instanceof Error ? error.message : 'Queue failed.');
    } finally {
      clearTimeout(timer);
      activeRequest.current = null;
      inFlight.current = false;
    }
  }

  return (
    <div className={`card status-${state === 'failed' ? 'error' : state === 'queued' ? 'success' : 'info'}`} data-video-factory-queue="replay-teaser">
      <p className="eyebrow">Queue action</p>
      <h3>Create Replay Teaser Job</h3>
      <p role="status" aria-live="polite" aria-atomic="true">{message}</p>
      <button className="button button-primary" type="button" onClick={queueReplayTeaser} disabled={!ready || state === 'queueing'}>
        {state === 'queueing' ? 'Queueing...' : 'Queue Replay Teaser'}
      </button>
    </div>
  );
}
