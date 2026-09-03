'use client';

import { useState } from 'react';

import { getStudioAuth } from '@/lib/studio/firebase-client';

export function RenderPackageButton() {
  const [status, setStatus] = useState('');

  async function openRenderPackage() {
    setStatus('Authenticating…');
    try {
      const user = getStudioAuth()?.currentUser;
      if (!user) throw new Error('Sign in to Studio before opening the protected render package.');
      const token = await user.getIdToken();
      const response = await fetch('/api/studio/video-factory/render', {
        headers: {Authorization: `Bearer ${token}`},
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
      <button className="button button-secondary" type="button" onClick={openRenderPackage}>
        Render Package API
      </button>
      {status ? <span role="status" className="sr-only">{status}</span> : null}
    </span>
  );
}
