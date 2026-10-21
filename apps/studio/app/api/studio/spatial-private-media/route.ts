import { NextResponse } from 'next/server';
import { applicationDefault, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { requireStudioLongformAuth, refreshStudioLongformAuth } from '@/lib/studio-life-movie-longform-auth';
import { verifyStudioSpatialAccountLink, SPATIAL_IDENTITY_PROJECT, STUDIO_IDENTITY_PROJECT } from '@/lib/studio-spatial-account-link';
import { verifyCurrentSpatialMemoryPlan } from '@/lib/studio-spatial-life-movie-contract';
import { verifiedFinalSpatialAsset, verifiedSegmentSpatialAsset, verifiedSpatialSegmentTimeline, sameVerifiedSpatialSegmentTimeline, sameAuthorizedMemoryPlan, sameFinalSpatialAsset, guardedSpatialPrivateResponse } from '@/lib/studio-spatial-private-playback';
import { callStudioLongformBridge, callStudioLongformPrivateBytes } from '@/lib/studio-life-movie-longform-client';
import { readStudioLongformJson } from '@/lib/studio-life-movie-longform-contract';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;
const APP_NAME = 'urai-spatial-cross-project-identity-readonly';
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PLAN = /^lmp_[A-Za-z0-9_-]{20,64}$/;
const headers = { 'Cache-Control': 'private, no-store, max-age=0',
  'Vary': 'Authorization, x-urai-spatial-id-token, Origin',
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
/** No permissive cross-origin fallback: the one approved Spatial browser
 * origin must be explicitly configured by the Studio deployment owner.
 * Authentication and memory rights remain mandatory on every POST. */
function allowedBrowserOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  if (origin === new URL(request.url).origin) return origin;
  const approved = String(process.env.URAI_STUDIO_SPATIAL_ALLOWED_ORIGINS || '')
    .split(',').map(value => value.trim()).filter(Boolean);
  if (!approved.includes(origin)) return null;
  let parsed: URL;
  try { parsed = new URL(origin); } catch { return null; }
  const local = process.env.NODE_ENV !== 'production' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (parsed.origin !== origin || parsed.username || parsed.password ||
      (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')))
    return null;
  return origin;
}
function cors(request: Request): Record<string,string> {
  const origin = allowedBrowserOrigin(request);
  return origin ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-urai-spatial-id-token',
    'Access-Control-Expose-Headers': 'content-type, content-length, x-urai-private-playlist-digest, x-urai-private-segment-index, x-urai-private-segment-start-ms, x-urai-private-segment-end-ms',
    'Access-Control-Max-Age': '60',
  } : {};
}
const deny = (request: Request) => NextResponse.json(
  { ok: false, error: 'spatial_private_media_authority_unavailable' },
  { status: 403, headers: { ...headers, ...cors(request) } },
);
export async function OPTIONS(request: Request): Promise<Response> {
  if (process.env.URAI_STUDIO_SPATIAL_PRIVATE_DELIVERY_ENABLED !== 'true' ||
      !request.headers.has('origin') || !allowedBrowserOrigin(request)) return deny(request);
  return new Response(null, { status: 204, headers: { ...headers, ...cors(request) } });
}

/** A separate, disabled-by-default bounded private transport. The original
 * read-only memory-plan preflight is preserved unchanged. Every request
 * separately revalidates existing Studio, Spatial, consent and Jobs authorities. */
export async function POST(request: Request): Promise<Response> {
  const actor = await requireStudioLongformAuth(request);
  if (!actor.ok) return deny(request);
  // Retain ownership of the single verified Buffer until the guarded stream
  // takes responsibility; scrub immediately if authorization is denied first.
  let privateBytes: Buffer | null = null;
  try {
    if (process.env.URAI_STUDIO_SPATIAL_PRIVATE_DELIVERY_ENABLED !== 'true' ||
        process.env.URAI_STUDIO_SPATIAL_IDENTITY_ENABLED !== 'true' ||
        process.env.URAI_STUDIO_SPATIAL_MEMORY_PLAN_ENABLED !== 'true' ||
        process.env.URAI_SPATIAL_BRIDGE_PROJECT_ID !== SPATIAL_IDENTITY_PROJECT ||
        !adminDb || getApp().options.projectId !== STUDIO_IDENTITY_PROJECT) throw new Error('disabled');
    const origin = request.headers.get('origin');
    if (origin && !allowedBrowserOrigin(request)) throw new Error('foreign_origin');
    if (request.headers.has('range')) throw new Error('range_unsupported');
    const value = await readStudioLongformJson(request, 4096) as Record<string,unknown>;
    const timelineAction = value?.action === 'read-spatial-timeline';
    const finalAction = value?.action === 'deliver-spatial-final';
    const segmentAction = value?.action === 'deliver-spatial-segment';
    if (!value || Array.isArray(value) || typeof value !== 'object' ||
        !(timelineAction || finalAction || segmentAction) ||
        typeof value.memoryId !== 'string' || !ID.test(value.memoryId) ||
        typeof value.movieId !== 'string' || !ID.test(value.movieId) ||
        typeof value.planId !== 'string' || !PLAN.test(value.planId) ||
        (timelineAction && Object.keys(value).length !== 4) ||
        (!timelineAction && value.kind !== 'mp4' && value.kind !== 'srt') ||
        (finalAction && (Object.keys(value).length !== 5 || 'segmentIndex' in value)) ||
        (segmentAction && (Object.keys(value).length !== 6 ||
          !Number.isSafeInteger(value.segmentIndex) || Number(value.segmentIndex) < 0 ||
          Number(value.segmentIndex) >= 180))) throw new Error('selector_invalid');
    const selector = { memoryId: value.memoryId, movieId: value.movieId, planId: value.planId };
    const kind = value.kind as 'mp4' | 'srt';
    const segmentIndex = segmentAction ? Number(value.segmentIndex) : null;
    const studioDb = adminDb;
    const app = getApps().find(a => a.name === APP_NAME) ||
      initializeApp({ credential: applicationDefault(), projectId: SPATIAL_IDENTITY_PROJECT }, APP_NAME);
    if (app.options.projectId !== SPATIAL_IDENTITY_PROJECT) throw new Error('project_mismatch');
    const spatialAuth = getAuth(app), spatialDb = getFirestore(app);
    const spatialIdToken = request.headers.get('x-urai-spatial-id-token') || '';
    const identityArgs = {
      studioUid: actor.uid, tenantId: actor.tenantId, spatialIdToken,
      verifySpatialToken: (token: string) => spatialAuth.verifyIdToken(token, true),
      readServerLink: async (id: string) => {
        const d = await studioDb.doc('studioSpatialAccountLinks/' + id).get();
        return d.exists ? d.data() : null;
      },
    };
    const readAuthority = async () => {
      const link = await verifyStudioSpatialAccountLink(identityArgs);
      const readPlan = () => verifyCurrentSpatialMemoryPlan({
        studioUid: actor.uid, tenantId: actor.tenantId, spatialUid: link.spatialUid,
        ...selector,
        readSpatial: async (path: string) => {
          const d = await spatialDb.doc(path).get();
          return d.exists ? d.data() : null;
        },
        hasPendingDeletion: async (uid: string) => {
          const [jobs, fence] = await Promise.all([
            spatialDb.collection('users/' + uid + '/deletionJobs')
              .where('state','in',['awaiting-grace','queued','in-progress','failed']).limit(1).get(),
            spatialDb.doc('users/' + uid + '/privacyRuntime/exportAuthority').get(),
          ]);
          if (!jobs.empty) return true;
          if (!fence.exists) return false;
          const generation = fence.get('generation'), pending = fence.get('pendingDeletions');
          return !Number.isSafeInteger(generation) || generation < 0 ||
            !pending || typeof pending !== 'object' || Array.isArray(pending) ||
            Object.keys(pending).length > 0;
        },
        readOwnedJobsPlan: ({userId,tenantId,planId}) =>
          callStudioLongformBridge({action:'status',userId,tenantId,planId}),
      });
      const first = await readPlan();
      const current = await refreshStudioLongformAuth(request, actor);
      if (!current.ok || current.uid !== actor.uid || current.tenantId !== actor.tenantId)
        throw new Error('studio_revoked');
      const linkedAgain = await verifyStudioSpatialAccountLink(identityArgs);
      if (link.spatialUid !== linkedAgain.spatialUid || link.revision !== linkedAgain.revision)
        throw new Error('account_link_changed');
      const second = await readPlan();
      sameAuthorizedMemoryPlan(first, second);
      return second;
    };

    const initial = await readAuthority();
    const playlist = await callStudioLongformBridge({
      action: 'playback', userId: actor.uid, tenantId: actor.tenantId, planId: selector.planId,
    });
    if (timelineAction) {
      const firstTimeline = verifiedSpatialSegmentTimeline(playlist, initial);
      sameAuthorizedMemoryPlan(initial, await readAuthority());
      const refreshedPlaylist = await callStudioLongformBridge({
        action: 'playback', userId: actor.uid, tenantId: actor.tenantId, planId: selector.planId,
      });
      const currentTimeline = verifiedSpatialSegmentTimeline(refreshedPlaylist, initial);
      sameVerifiedSpatialSegmentTimeline(firstTimeline, currentTimeline);
      sameAuthorizedMemoryPlan(initial, await readAuthority());
      if (request.signal.aborted) throw new Error('timeline_cancelled');
      // A private timeline is not an authorization token. Every subsequent
      // segment request must independently revalidate current owner and consent.
      return NextResponse.json({ ok: true, timeline: currentTimeline },
        { status: 200, headers: { ...headers, ...cors(request) } });
    }
    const asset = segmentIndex === null
      ? verifiedFinalSpatialAsset(playlist, initial, kind)
      : verifiedSegmentSpatialAsset(playlist, initial, kind, segmentIndex);
    sameAuthorizedMemoryPlan(initial, await readAuthority());
    const bytes = await callStudioLongformPrivateBytes({
      action: 'deliver', userId: actor.uid, tenantId: actor.tenantId, planId: selector.planId,
      artifact: segmentIndex === null ? 'final' : `segment:${segmentIndex}`,
      kind, authorityHash: asset.authorityHash,
      expiresAt: asset.expiresAt, generation: asset.generation, disposition: 'inline',
    }, { sha256: asset.sha256, mimeType: asset.mimeType, signal: request.signal });
    privateBytes = bytes;
    sameAuthorizedMemoryPlan(initial, await readAuthority());
    const latestPlaylist = await callStudioLongformBridge({
      action: 'playback', userId: actor.uid, tenantId: actor.tenantId, planId: selector.planId,
    });
    const latest = segmentIndex === null
      ? verifiedFinalSpatialAsset(latestPlaylist, initial, kind)
      : verifiedSegmentSpatialAsset(latestPlaylist, initial, kind, segmentIndex);
    sameFinalSpatialAsset(asset, latest);
    sameAuthorizedMemoryPlan(initial, await readAuthority());
    // Defense in depth: even a broken upstream response cannot send a caption
    // larger than original Spatial Replay's 2 MiB private SRT ceiling.
    if (request.signal.aborted || !bytes.length ||
        bytes.length > (kind === 'srt' ? 2 * 1024 * 1024 : 64 * 1024 * 1024))
      throw new Error('delivery_cancelled');
    // Existing owner-scoped Jobs transport verifies SHA-256 over all bytes
    // before this route releases them; no streaming before full verification.
    // The guarded stream scrubs this exact original Buffer upon completion,
    // abort, denial or reader cancellation. Do not retain an unsanitized copy.
    return guardedSpatialPrivateResponse({ bytes, signal: request.signal,
      expiresAt: asset.expiresAt,
      reauthorize: async () => { sameAuthorizedMemoryPlan(initial, await readAuthority()); },
      headers: {
      ...headers, ...cors(request), 'Content-Type': asset.mimeType,
      'X-URAI-PRIVATE-PLAYLIST-DIGEST': String((latestPlaylist.playback as Record<string,unknown>).playlistDigest),
      'Content-Disposition': 'inline; filename="urai-authorized-life-movie"',
      'Content-Length': String(bytes.length),
      ...(segmentIndex === null ? {} : {
        'X-URAI-PRIVATE-SEGMENT-INDEX': String(segmentIndex),
        'X-URAI-PRIVATE-SEGMENT-START-MS': String(asset.startMs),
        'X-URAI-PRIVATE-SEGMENT-END-MS': String(asset.endMs),
      }),
    } });
  } catch {
    privateBytes?.fill(0);
    return deny(request);
  }
}
