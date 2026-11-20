import { NextResponse } from 'next/server';
import { requireStudioLongformAuth, refreshStudioLongformAuth } from '@/lib/studio-life-movie-longform-auth';
import { callStudioJobsBridge } from '@/lib/studio-life-movie-jobs-client';

export const dynamic = 'force-dynamic';

function json(value: Record<string, unknown>, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// Only a Jobs-signed, short-lived capability may cross the playback boundary.
// The Studio HTTP caller never supplies owner, tenant, raw object path or URL.
export async function GET(request: Request) {
  const owner = await requireStudioLongformAuth(request);
  if (!owner.ok) return json({ ok: false, error: 'studio_current_authority_required' }, 403);
  const query = new URL(request.url).searchParams;
  const jobIds = query.getAll('jobId');
  if (jobIds.length !== 1 || [...query.keys()].some(key => key !== 'jobId')
    || !/^[A-Za-z0-9_-]{10,64}$/.test(jobIds[0])) {
    return json({ ok: false, error: 'studio_job_reference_invalid' }, 400);
  }
  const jobId = jobIds[0];
  try {
    const result = await callStudioJobsBridge({
      action: 'playback', tenantId: owner.tenantId, userId: owner.uid, jobId,
    });
    const current = await refreshStudioLongformAuth(request, owner);
    if (!current.ok || current.uid !== owner.uid || current.tenantId !== owner.tenantId) {
      return json({ ok: false, error: 'studio_current_authority_required' }, 403);
    }
    const playback = result.playback;
    if (!playback || typeof playback !== 'object' || Array.isArray(playback)) throw new Error('invalid_playback');
    const candidate = playback as Record<string, unknown>;
    if (candidate.publicReleaseAuthorized !== false
        || candidate.disposition !== 'inline'
        || typeof candidate.expiresAt !== 'string') throw new Error('invalid_playback');
    const expiry = Date.parse(candidate.expiresAt);
    if (!Number.isFinite(expiry) || expiry <= Date.now() || expiry > Date.now() + 5 * 60 * 1000 + 5000) {
      throw new Error('invalid_playback');
    }
    const video = candidate.video;
    if (!video || typeof video !== 'object' || Array.isArray(video)) throw new Error('invalid_playback');
    const media = video as Record<string, unknown>;
    if (media.mimeType !== 'video/mp4' || typeof media.url !== 'string') throw new Error('invalid_playback');
    const url = new URL(media.url);
    if (url.protocol !== 'https:' || url.username || url.password
        || !(url.hostname === 'storage.googleapis.com' || url.hostname.endsWith('.storage.googleapis.com'))
        || url.hash) throw new Error('invalid_playback');
    if (candidate.subtitleText !== undefined
        && (typeof candidate.subtitleText !== 'string' || candidate.subtitleText.length > 2 * 1024 * 1024)) throw new Error('invalid_playback');
    // This URL is a bearer capability, not public media. No raw GCS path,
    // arbitrary worker output or bridge credential is returned.
    return json({
      ok: true,
      playback: {
        jobId,
        mimeType: 'video/mp4',
        url: url.toString(),
        expiresAt: candidate.expiresAt,
        subtitleText: candidate.subtitleText ?? '',
        publicReleaseAuthorized: false,
      },
    });
  } catch {
    // Jobs remains authoritative on current consent, deletion, output,
    // signing and post-signing rechecks; never fall back to demo media.
    return json({ ok: false, error: 'studio_playback_unavailable' }, 503);
  }
}
