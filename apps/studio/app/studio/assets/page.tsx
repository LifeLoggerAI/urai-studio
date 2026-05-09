'use client';

import Image from 'next/image';
import { useEffect, useState, type ReactElement } from 'react';

import { StudioActionPanel } from '@/components/studio/StudioActionPanel';
import { subscribeAssetManifests, subscribeGenerationJobs } from '@/lib/assets/client';
import type { StudioAssetManifest, StudioGenerationJob } from '@/lib/assets/types';

function renderArtifact(manifest: StudioAssetManifest): ReactElement {
  const artifact = manifest.artifacts?.[0];
  if (!artifact) return <p>No artifact attached.</p>;

  if (artifact.mimeType.startsWith('image/')) {
    return (
      <Image
        src={artifact.url}
        alt={manifest.promptPreview || manifest.manifestId}
        width={960}
        height={540}
        style={{ maxWidth: '100%', height: 'auto', borderRadius: 12 }}
        unoptimized
      />
    );
  }

  if (artifact.mimeType.startsWith('video/')) {
    return <video src={artifact.url} controls style={{ width: '100%', borderRadius: 12 }} />;
  }

  if (artifact.mimeType.startsWith('audio/')) {
    return <audio src={artifact.url} controls style={{ width: '100%' }} />;
  }

  return (
    <a href={artifact.url} target="_blank" rel="noreferrer">
      Open artifact
    </a>
  );
}

const assetContracts = [
  { title: 'Upload path', body: 'User uploads belong under user-uploads/{uid}/studio/**.' },
  { title: 'Generated path', body: 'Generated outputs belong under generated/{uid}/studio/** and are function-owned.' },
  { title: 'Public path', body: 'Public Studio assets belong under public/studio-assets/** with public read only.' },
];

export default function StudioAssetsPage() {
  const [manifests, setManifests] = useState<StudioAssetManifest[]>([]);
  const [jobs, setJobs] = useState<StudioGenerationJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubManifests = subscribeAssetManifests(setManifests, (err) => setError(err.message));
    const unsubJobs = subscribeGenerationJobs(setJobs, (err) => setError(err.message));
    return () => {
      unsubManifests();
      unsubJobs();
    };
  }, []);

  return (
    <section className="page-stack" data-urai-studio-page="studio-assets">
      <p className="eyebrow">Asset Factory</p>
      <h1>Generated Assets</h1>
      <p className="hero-lede">Live asset pipeline view: generation jobs, manifests, previews, spatial compatibility, and callable-backed asset job creation.</p>

      <div className="grid three">
        {assetContracts.map((contract) => (
          <article className="card" key={contract.title}>
            <p className="eyebrow">Storage contract</p>
            <h2>{contract.title}</h2>
            <p>{contract.body}</p>
          </article>
        ))}
      </div>

      <StudioActionPanel />

      {error ? <p style={{ color: '#f87171' }}>Firestore error: {error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 24, marginTop: 24 }}>
        <aside style={{ border: '1px solid #27272a', borderRadius: 16, padding: 16 }}>
          <h2>Jobs</h2>
          {jobs.length === 0 ? <p>No generation jobs yet.</p> : null}
          <div style={{ display: 'grid', gap: 12 }}>
            {jobs.map((job) => (
              <div key={job.jobId} style={{ border: '1px solid #3f3f46', borderRadius: 12, padding: 12 }}>
                <strong>{job.status}</strong>
                <p style={{ margin: '8px 0' }}>{job.request?.prompt || job.request?.promptPreview || 'Untitled generation'}</p>
                <small>{job.provider} / {job.model}</small>
                {job.error?.message ? <p style={{ color: '#fca5a5' }}>{job.error.message}</p> : null}
              </div>
            ))}
          </div>
        </aside>

        <main style={{ display: 'grid', gap: 16 }}>
          <h2>Manifests</h2>
          {manifests.length === 0 ? <p>No asset manifests yet.</p> : null}
          {manifests.map((manifest) => (
            <article key={manifest.manifestId} style={{ border: '1px solid #27272a', borderRadius: 16, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }}>
                <div>
                  <h3>{manifest.assetType}</h3>
                  <p>{manifest.promptPreview}</p>
                  <small>{manifest.provider} / {manifest.model}</small>
                </div>
                <span style={{ border: '1px solid #52525b', borderRadius: 999, padding: '4px 10px' }}>
                  {manifest.spatialCompatibility?.supported ? manifest.spatialCompatibility.type : 'not spatial'}
                </span>
              </div>

              <div style={{ marginTop: 16 }}>{renderArtifact(manifest)}</div>

              <details style={{ marginTop: 16 }}>
                <summary>Manifest details</summary>
                <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(manifest, null, 2)}</pre>
              </details>
            </article>
          ))}
        </main>
      </div>
    </section>
  );
}
