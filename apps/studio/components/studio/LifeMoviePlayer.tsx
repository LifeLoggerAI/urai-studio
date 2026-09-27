'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type PlaybackPayload = {
  expiresAt?: string;
  video?: { url?: string; mimeType?: string; checksum?: string };
  subtitleText?: string;
  renderPlanDigest?: string;
  publicReleaseAuthorized?: false;
};

function parseTimestamp(value: string) {
  const match = value.trim().match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/);
  if (!match) return null;
  const [, hours, minutes, seconds, millis] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(millis) / 1000;
}

function parseSrt(srt: string) {
  return srt.replace(/\r/g, '').trim().split(/\n{2,}/).flatMap((block) => {
    const lines = block.split('\n');
    const timeIndex = lines.findIndex((line) => line.includes('-->'));
    if (timeIndex < 0) return [];
    const [startRaw, endRaw] = lines[timeIndex].split('-->').map((value) => value.trim());
    const start = parseTimestamp(startRaw);
    const end = parseTimestamp(endRaw);
    const text = lines.slice(timeIndex + 1).join('\n').trim();
    return start !== null && end !== null && end > start && text ? [{ start, end, text }] : [];
  });
}

function transcriptFromSrt(srt: string) {
  return parseSrt(srt).map((cue) => cue.text).join('\n\n');
}

export function LifeMoviePlayer({ jobId }: { jobId: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playback, setPlayback] = useState<PlaybackPayload | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [captionTrackAdded, setCaptionTrackAdded] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    setCaptionTrackAdded(false);
    try {
      const response = await fetch(`/api/studio/life-movies?jobId=${encodeURIComponent(jobId)}&playback=1`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({})) as {
        ok?: boolean;
        status?: string;
        playback?: PlaybackPayload;
      };
      if (!response.ok || payload.ok !== true || !payload.playback?.video?.url) {
        throw new Error(payload.status || `playback_http_${response.status}`);
      }
      setPlayback(payload.playback);
      setStatus('ready');
    } catch (cause) {
      setPlayback(null);
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'life_movie_playback_failed');
    }
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const video = videoRef.current;
    const subtitleText = playback?.subtitleText || '';
    if (!video || !subtitleText || captionTrackAdded || typeof VTTCue === 'undefined') return;
    const cues = parseSrt(subtitleText);
    if (!cues.length) return;
    const track = video.addTextTrack('captions', 'Captions', 'en');
    for (const cue of cues) track.addCue(new VTTCue(cue.start, cue.end, cue.text));
    track.mode = 'showing';
    setCaptionTrackAdded(true);
  }, [playback, captionTrackAdded]);

  const transcript = useMemo(() => transcriptFromSrt(playback?.subtitleText || ''), [playback?.subtitleText]);

  if (status === 'loading') {
    return <section className="section-panel" aria-live="polite"><p>Loading private Life Movie playback…</p></section>;
  }

  if (status === 'error' || !playback?.video?.url) {
    return (
      <section className="section-panel" role="alert">
        <h2>Playback is not available yet.</h2>
        <p>{error || 'The private playback grant could not be created.'}</p>
        <button className="button button-primary" type="button" onClick={() => void load()}>Try again</button>
      </section>
    );
  }

  return (
    <section className="section-panel" aria-label="Life Movie player">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        src={playback.video.url}
        onError={() => {
          setStatus('error');
          setError('private_playback_url_expired_or_unavailable');
        }}
        style={{ width: '100%', maxWidth: '100%', height: 'auto', background: '#000' }}
      >
        Your browser does not support HTML video.
      </video>

      <div className="grid two">
        <article className="card">
          <p className="eyebrow">Privacy</p>
          <h2>Private playback</h2>
          <p>The viewing grant is temporary. This player does not authorize public release.</p>
          {playback.expiresAt ? <p>Access expires: <time dateTime={playback.expiresAt}>{new Date(playback.expiresAt).toLocaleString()}</time></p> : null}
        </article>
        <article className="card">
          <p className="eyebrow">Evidence</p>
          <h2>Bound to the render</h2>
          {playback.video.checksum ? <p>Video checksum: <code>{playback.video.checksum}</code></p> : null}
          {playback.renderPlanDigest ? <p>Render plan: <code>{playback.renderPlanDigest}</code></p> : null}
        </article>
      </div>

      {transcript ? (
        <details className="card">
          <summary>Transcript and captions</summary>
          <p style={{ whiteSpace: 'pre-wrap' }}>{transcript}</p>
        </details>
      ) : null}
    </section>
  );
}
