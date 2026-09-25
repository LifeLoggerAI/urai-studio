'use client';

import { useState } from 'react';

import { getStudioAuth } from '@/lib/studio/firebase-client';

export function RenderPackageButton() {
  const [status, setStatus] = useState('');
  const [studioId, setStudioId] = useState('');

  async function openRenderPackage() {
    setStatus('Authenticating…');
    try {
      const user = getStudioAuth()?.currentUser;
      if (!user) throw new Error('Sign in to Studio before opening the protected render package.');
      const selectedStudioId = studioId.trim();
      if (!selectedStudioId || selectedStudioId.includes('/')) throw new Error('Select a valid Studio ID.');
      const token = await user.getIdToken();
      const response = await fetch('/api/studio/video-factory/render', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-urai-studio-id': selectedStudioId,
        },
      });
      const body = await response.text();
      if (!response.ok) throw new Error(`Render package request failed (${response.status}): ${body}`);
      const blobUrl = URL.createObjectURL(new Blob([body], {type: 'application/json'}));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'urai-studio-render-package.json';
      link.click();
      URL.revokeObjectURL(blobUrl);
      setStatus('Authenticated render package downloaded.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Render package request failed.');
    }
  }

  return (
    <span>
      <label>
        <span className="sr-only">Studio ID</span>
        <input
          value={studioId}
          onChange={(event) => setStudioId(event.target.value)}
          aria-label="Studio ID"
          autoComplete="off"
        />
      </label>
      <button className="button button-secondary" type="button" onClick={openRenderPackage}>
        Render Package API
      </button>
      {status ? <span role="status" className="sr-only">{status}</span> : null}
    </span>
  );
}
