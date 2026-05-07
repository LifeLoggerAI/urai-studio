'use client';

import { useEffect, useState } from 'react';
import { subscribeAssetManifests, subscribeGenerationJobs } from '@/lib/assets/client';
import { StudioAssetManifest, StudioGenerationJob } from '@/lib/assets/types';
import { firebaseClientConfigStatus } from '@/lib/firebaseClient';

function renderArtifact(manifest: StudioAssetManifest) {
  const artifact = manifest.artifacts?.[0];
  if (!artifact) return <p>No artifact attached.</p>;

  if (artifact.mimeType.startsWith('image/')) {
    return <img src={artifact.url} alt={manifest.promptPreview || manifest.manifestId} style={{ maxWidth: '100%', borderRadius: 12 }} />;
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

export default function StudioAssetsPage() {
  const [manifests, setManifests] = useState<StudioAssetManifest[]>([]);
  const [jobs, setJobs] = useState<StudioGenerationJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setError(null);
    setIsLoading(true);

    const handleError = (err: Error) => {
      setError(err.message);
      setIsLoading(false);
    };

    const unsubManifests = subscribeAssetManifests((items) => {
      setManifests(items);
      setIsLoading(false);
    }, handleError);
    const unsubJobs = subscribeGenerationJobs((items) => {
      setJobs(items);
      setIsLoading(false);
    }, handleError);

    return () => {
      unsubManifests();
      unsubJobs();
    };
  }, []);

  const isFirebaseUnavailable = !firebaseClientConfigStatus.configured;

  return (
    <section>
      <p style={{ color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 2 }}>URAI Studio</p>
      <h1>Generated Assets</h1>
      <p>Live asset pipeline view: generation jobs, manifests, previews, and spatial compatibility.</p>

      {isFirebaseUnavailable ? (
        <div role="status" className="card" style={{ borderColor: '#f59e0b', marginTop: 16 }}>
          <strong>Live asset data is not connected in this environment.</strong>
          <p>
            Add the required <code>NEXT_PUBLIC_FIREBASE_*</code> values to enable realtime generation jobs and
            asset manifests. The page remains available so builds and local previews do not fail.
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" style={{ color: '#f87171' }}>
          Asset pipeline unavailable: {error}
        </p>
      ) : null}

      {isLoading ? <p role="status">Loading live asset pipeline…</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 24 }}>
        <aside style={{ border: '1px solid #27272a', borderRadius: 16, padding: 16 }}>
          <h2>Jobs</h2>
          {!isLoading && jobs.length === 0 ? <p>No generation jobs yet.</p> : null}
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
          {!isLoading && manifests.length === 0 ? <p>No asset manifests yet.</p> : null}
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
