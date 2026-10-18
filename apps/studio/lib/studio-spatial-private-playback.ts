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
        part.gapBeforeMs !== Math.max(0, Number(part.startMs) - priorEnd) ||
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
    const selected = segments[segmentIndex], part = row(playlist.segments[segmentIndex]);
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
