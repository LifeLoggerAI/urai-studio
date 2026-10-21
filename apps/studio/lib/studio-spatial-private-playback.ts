import { createHash } from 'node:crypto';

const SHA = /^[a-f0-9]{64}$/;
const GEN = /^[1-9][0-9]*$/;
const PLAN = /^lmp_[A-Za-z0-9_-]{20,64}$/;
type Kind = 'mp4' | 'srt';
type Row = Record<string, unknown>;
const fail = (): never => { throw new Error('spatial_private_playback_unavailable'); };
const row = (value: unknown): Row =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Row : fail();
const sha = (value: unknown) => typeof value === 'string' && SHA.test(value);
const int = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export type AuthorizedMemoryPlan = Readonly<{
  ownerUid: string; memoryId: string; movieId: string; planId: string;
  sceneTruthPacketId: unknown; sceneTruthDigest: string;
  renderPlanDigest: string; sceneTruthReceiptRef: string;
}>;
export type FinalPrivateAsset = Readonly<{
  planId: string; kind: Kind; sha256: string; mimeType: 'video/mp4' | 'application/x-subrip';
  authorityHash: string; generation: string; expiresAt: number;
  segmentIndex?: number; startMs?: number; endMs?: number;
  gapBeforeMs?: number; playlistDigest?: string;
}>;
export function sameAuthorizedMemoryPlan(first: AuthorizedMemoryPlan, second: AuthorizedMemoryPlan) {
  for (const field of ['ownerUid', 'memoryId', 'movieId', 'planId', 'sceneTruthPacketId',
    'sceneTruthDigest', 'renderPlanDigest', 'sceneTruthReceiptRef'] as const) {
    if (!first[field] || first[field] !== second[field]) fail();
  }
}

/** Jobs is authenticated by the existing server bridge. Its playlist still
 * must match the currently re-read Spatial memory/plan and both final outputs.
 * No public URL, bucket name or client-supplied storage path is accepted. */
export function verifiedFinalSpatialAsset(
  response: unknown, authority: AuthorizedMemoryPlan, kind: Kind,
  now = Date.now(), segmentIndex: number | null = null,
): FinalPrivateAsset {
  if (!int(now) || (kind !== 'mp4' && kind !== 'srt') ||
      (segmentIndex !== null && (!int(segmentIndex) || segmentIndex >= 180))) fail();
  const envelope = row(response);
  if (envelope.ok !== true) fail();
  const playlist = row(envelope.playback);
  if (playlist.schemaVersion !== 'urai-life-movie-private-playlist-v1' ||
      playlist.planId !== authority.planId || !PLAN.test(authority.planId) ||
      playlist.publicReleaseAuthorized !== false ||
      playlist.sceneTruthDigest !== authority.sceneTruthDigest ||
      playlist.renderPlanDigest !== authority.renderPlanDigest ||
      !sha(playlist.playlistDigest)) fail();
  const expiry = typeof playlist.expiresAt === 'string' ? Date.parse(playlist.expiresAt) : NaN;
  if (!Number.isSafeInteger(expiry) || expiry <= now || expiry > now + 300_000) fail();

  // Reconstruct Jobs' playlist digest from segment timing and video/caption
  // checksums. A final asset is admitted only alongside its matching captions.
  if (!Array.isArray(playlist.segments) || playlist.segments.length < 1 ||
      playlist.segments.length > 180) fail();
  let priorEnd = 0;
  const segments = (playlist.segments as unknown[]).map((entry: unknown, i: number) => {
    const part = row(entry), video = row(part.video), captions = row(part.subtitles);
    if (part.index !== i || !int(part.startMs) || !int(part.endMs) ||
        Number(part.endMs) <= Number(part.startMs) ||
        Number(part.startMs) < priorEnd ||
        part.gapBeforeMs !== Number(part.startMs) - priorEnd ||
        !sha(video.checksum) || !sha(captions.checksum) ||
        video.mimeType !== 'video/mp4' || captions.mimeType !== 'application/x-subrip') fail();
    priorEnd = Number(part.endMs);
    return { index: i, startMs: part.startMs, endMs: part.endMs,
      gapBeforeMs: part.gapBeforeMs, videoChecksum: video.checksum,
      subtitleChecksum: captions.checksum };
  });
  const calculated = createHash('sha256').update(JSON.stringify({
    schemaVersion: 'urai-life-movie-private-playlist-v1',
    planId: authority.planId, renderPlanDigest: authority.renderPlanDigest,
    sceneTruthDigest: authority.sceneTruthDigest, segments,
  })).digest('hex');
  if (calculated !== playlist.playlistDigest) fail();

  const verify = (value: unknown, currentKind: Kind, expectedArtifact: string) => {
    const asset = row(value), descriptor = row(asset.delivery);
    const mime = currentKind === 'mp4' ? 'video/mp4' : 'application/x-subrip';
    if (Object.keys(asset).some(k => !['delivery','mimeType','checksum'].includes(k)) ||
        Object.keys(descriptor).some(k => !['schemaVersion','requiresAuthorization','action',
          'kind','authorityHash','expiresAt','generation','disposition','planId','artifact'].includes(k)) ||
        asset.mimeType !== mime || !sha(asset.checksum) ||
        descriptor.schemaVersion !== 'urai-authenticated-private-media-v1' ||
        descriptor.requiresAuthorization !== true || descriptor.action !== 'deliver' ||
        descriptor.planId !== authority.planId || descriptor.artifact !== expectedArtifact ||
        descriptor.kind !== currentKind || descriptor.disposition !== 'inline' ||
        !sha(descriptor.authorityHash) || typeof descriptor.generation !== 'string' ||
        !GEN.test(descriptor.generation) || !int(descriptor.expiresAt) ||
        Number(descriptor.expiresAt) <= now || Number(descriptor.expiresAt) > now + 300_000 ||
        descriptor.expiresAt !== expiry) fail();
    return { planId: authority.planId, kind: currentKind, sha256: asset.checksum as string,
      mimeType: mime as 'video/mp4' | 'application/x-subrip',
      authorityHash: descriptor.authorityHash as string,
      generation: descriptor.generation as string, expiresAt: descriptor.expiresAt as number };
  };
  // Long-form segments use Jobs' existing owner-bound segment:N artifacts.
  // Never accept caller-controlled paths, arbitrary ranges, or an unverified
  // segment outside the digest-bound timeline. The final-file path remains
  // unchanged for the existing original Replay.
  if (segmentIndex !== null) {
    if (segmentIndex >= segments.length) fail();
    const selected = segments[segmentIndex], part = row((playlist.segments as unknown[])[segmentIndex]);
    if (Number(selected.endMs) - Number(selected.startMs) > 15_000) fail();
    const video = verify(part.video, 'mp4', 'segment:' + segmentIndex);
    const captions = verify(part.subtitles, 'srt', 'segment:' + segmentIndex);
    if (video.sha256 !== selected.videoChecksum || captions.sha256 !== selected.subtitleChecksum ||
        video.authorityHash !== captions.authorityHash || video.expiresAt !== captions.expiresAt)
      fail();
    const chosen = kind === 'mp4' ? video : captions;
    return Object.freeze({ ...chosen, segmentIndex,
      startMs: Number(selected.startMs), endMs: Number(selected.endMs),
      gapBeforeMs: Number(selected.gapBeforeMs),
      playlistDigest: playlist.playlistDigest as string });
  }
  const finalFile = row(playlist.finalFile);
  const video = verify(finalFile.video, 'mp4', 'final');
  const captions = verify(finalFile.subtitles, 'srt', 'final');
  if (video.authorityHash !== captions.authorityHash ||
      video.expiresAt !== captions.expiresAt) fail();
  return Object.freeze(kind === 'mp4' ? video : captions);
}


/** A private, bounded projection of Jobs' fully authenticated playlist. Each
 * segment's video and captions must independently validate against Jobs'
 * digest-bound descriptors before its existence or timing can be disclosed. */
export type VerifiedSpatialSegmentTimeline = Readonly<{
  schemaVersion: 'urai-spatial-private-segment-timeline-v1';
  movieId: string; planId: string; playlistDigest: string; expiresAt: number;
  durationMs: number;
  segments: ReadonlyArray<Readonly<{ index: number; startMs: number; endMs: number; gapBeforeMs: number }>>;
}>;

export function verifiedSpatialSegmentTimeline(
  response: unknown, authority: AuthorizedMemoryPlan, now = Date.now(),
): VerifiedSpatialSegmentTimeline {
  const envelope = row(response), playlist = row(envelope.playback);
  if (!Array.isArray(playlist.segments) || playlist.segments.length < 1 ||
      playlist.segments.length > 180) fail();
  let expectedDigest: string | undefined;
  let expectedExpiry: number | undefined;
  const playlistSegments = playlist.segments as unknown[];
  const segments = playlistSegments.map((_part: unknown, index: number) => {
    const video = verifiedSegmentSpatialAsset(response, authority, 'mp4', index, now);
    const captions = verifiedSegmentSpatialAsset(response, authority, 'srt', index, now);
    const startMs = Number(video.startMs), endMs = Number(video.endMs);
    const gapBeforeMs = Number(video.gapBeforeMs);
    if (!int(startMs) || !int(endMs) || !int(gapBeforeMs) ||
        endMs <= startMs || endMs > 45 * 60 * 1000 ||
        video.startMs !== captions.startMs || video.endMs !== captions.endMs ||
        video.gapBeforeMs !== captions.gapBeforeMs ||
        !video.playlistDigest || video.playlistDigest !== captions.playlistDigest ||
        video.authorityHash !== captions.authorityHash || video.expiresAt !== captions.expiresAt ||
        (expectedDigest !== undefined && video.playlistDigest !== expectedDigest) ||
        (expectedExpiry !== undefined && video.expiresAt !== expectedExpiry)) fail();
    expectedDigest = video.playlistDigest;
    expectedExpiry = video.expiresAt;
    return Object.freeze({ index, startMs, endMs, gapBeforeMs });
  });
  if (!expectedDigest || !expectedExpiry || expectedExpiry <= now ||
      !segments.length || !int(segments[segments.length - 1].endMs)) fail();
  const digest = expectedDigest as string;
  const expiry = expectedExpiry as number;
  return Object.freeze({
    schemaVersion: 'urai-spatial-private-segment-timeline-v1',
    movieId: authority.movieId, planId: authority.planId,
    playlistDigest: digest, expiresAt: expiry,
    durationMs: segments[segments.length - 1].endMs,
    segments: Object.freeze(segments),
  });
}

export function sameVerifiedSpatialSegmentTimeline(
  first: VerifiedSpatialSegmentTimeline, second: VerifiedSpatialSegmentTimeline,
) {
  if (first.planId !== second.planId || first.movieId !== second.movieId ||
      first.playlistDigest !== second.playlistDigest ||
      first.durationMs !== second.durationMs ||
      first.expiresAt <= Date.now() || second.expiresAt <= Date.now() ||
      first.segments.length !== second.segments.length) fail();
  for (let index = 0; index < first.segments.length; index++) {
    const a = first.segments[index], b = second.segments[index];
    if (a.index !== b.index || a.startMs !== b.startMs ||
        a.endMs !== b.endMs || a.gapBeforeMs !== b.gapBeforeMs) fail();
  }
}

/** Segment and final deliveries share the same immutable resource comparison. */
export function verifiedSegmentSpatialAsset(
  response: unknown, authority: AuthorizedMemoryPlan, kind: Kind, index: number,
  now = Date.now(),
): FinalPrivateAsset {
  if (!Number.isSafeInteger(index) || index < 0 || index >= 180) fail();
  return verifiedFinalSpatialAsset(response, authority, kind, now, index);
}

export function sameFinalSpatialAsset(first: FinalPrivateAsset, second: FinalPrivateAsset) {
  for (const field of ['planId','kind','sha256','mimeType','authorityHash','generation',
    'segmentIndex','startMs','endMs','gapBeforeMs','playlistDigest'] as const) {
    if (first[field] !== second[field]) fail();
  }
  if (first.expiresAt <= Date.now() || second.expiresAt <= Date.now()) fail();
}

/** The upstream Jobs bridge has fully checked the checksum before this point.
 * Recheck the original Studio/Spatial consent and owner authority for every
 * bounded chunk as it leaves Studio, because response streaming may continue
 * after an earlier request-time consent check. Never hand a single unguarded
 * 64 MiB buffer to Next's response transport. */
export function guardedSpatialPrivateResponse(args: {
  bytes: Uint8Array;
  headers: HeadersInit;
  reauthorize: () => Promise<void>;
  signal: AbortSignal;
  expiresAt: number;
}): Response {
  const { bytes, reauthorize, signal } = args;
  const deadline = args.expiresAt;
  if (!bytes.byteLength || bytes.byteLength > 64 * 1024 * 1024 ||
      !Number.isSafeInteger(deadline) || deadline <= Date.now() || signal.aborted) {
    bytes.fill(0);
    throw new Error('spatial_private_media_delivery_unavailable');
  }
  let offset = 0;
  let ended = false;
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
  const scrub = () => {
    if (ended) return;
    ended = true;
    bytes.fill(0);
    signal.removeEventListener('abort', revoke);
    if (deadlineTimer !== undefined) clearTimeout(deadlineTimer);
  };
  const revoke = () => {
    if (ended) return;
    scrub();
    // Reject even an unread response: otherwise an expired, aborted private
    // Buffer can outlive its authorization until a consumer starts pulling.
    try { streamController?.error(new Error('spatial_private_media_delivery_unavailable')); } catch {}
  };
  const denied = () => signal.aborted || Date.now() >= deadline;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
      signal.addEventListener('abort', revoke, { once: true });
      deadlineTimer = setTimeout(revoke, Math.max(1, deadline - Date.now()));
      deadlineTimer.unref?.();
      if (denied()) revoke();
    },
    async pull(controller) {
      if (ended) return;
      try {
        if (denied()) throw new Error('private_media_delivery_expired');
        // Firestore and Auth reads cannot always be cancelled. Stop waiting
        // for a stalled recheck when this request aborts or its authorization
        // window closes; otherwise the response can retain private bytes.
        let stopAbort = () => {};
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            Promise.resolve().then(() => {
              if (denied()) throw new Error('private_media_delivery_expired');
              return reauthorize();
            }),
            new Promise<never>((_resolve, reject) => {
              const refuse = () => reject(new Error('private_media_delivery_expired'));
              signal.addEventListener('abort', refuse, { once: true });
              stopAbort = () => signal.removeEventListener('abort', refuse);
              // Keep a bounded pending private response in case the authority
              // backend hangs without emitting an AbortSignal.
              timeout = setTimeout(refuse, Math.max(1, Math.min(15_000, deadline - Date.now())));
              if (denied()) refuse();
            }),
          ]);
        } finally {
          stopAbort();
          if (timeout !== undefined) clearTimeout(timeout);
        }
        if (denied()) throw new Error('private_media_delivery_expired');
        const end = Math.min(bytes.byteLength, offset + 1024 * 1024);
        // Copy so zeroizing the source after completion cannot mutate queued
        // response chunks. No private bytes enter logs, errors or public URLs.
        const part = Uint8Array.from(bytes.subarray(offset, end));
        offset = end;
        controller.enqueue(part);
        if (offset === bytes.byteLength) { scrub(); controller.close(); }
      } catch {
        revoke();
      }
    },
    cancel() { scrub(); },
  }, { highWaterMark: 0 });
  return new Response(stream, { status: 200, headers: args.headers });
}
