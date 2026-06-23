'use client';

import { useState } from 'react';

type QueueState = 'idle' | 'queueing' | 'queued' | 'failed';

export function QueueReplayTeaserButton({ templateId, prompt }: { templateId: string; prompt: string }) {
  const [state, setState] = useState<QueueState>('idle');
  const [message, setMessage] = useState('Ready to queue the Replay Teaser through the existing Studio job API.');

  async function queueReplayTeaser() {
    setState('queueing');
    setMessage('Queueing Replay Teaser job...');

    try {
      const response = await fetch('/api/studio/video-factory', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templateId, prompt }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || `Queue failed with ${response.status}`);
      }

      setState('queued');
      setMessage(`Queued Replay Teaser job${payload?.job?.id ? `: ${payload.job.id}` : '.'}`);
    } catch (error) {
      setState('failed');
      setMessage(error instanceof Error ? error.message : 'Queue failed.');
    }
  }

  return (
    <div className={`card status-${state === 'failed' ? 'error' : state === 'queued' ? 'success' : 'info'}`} data-video-factory-queue="replay-teaser">
      <p className="eyebrow">Queue action</p>
      <h3>Create Replay Teaser Job</h3>
      <p>{message}</p>
      <button className="button button-primary" type="button" onClick={queueReplayTeaser} disabled={state === 'queueing'}>
        {state === 'queueing' ? 'Queueing...' : 'Queue Replay Teaser'}
      </button>
    </div>
  );
}
