import { createHash } from 'node:crypto';
import { StudioLongformError } from './studio-life-movie-longform-contract';

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PLAN = /^lmp_[A-Za-z0-9_-]{20,64}$/;
const SHA = /^[a-f0-9]{64}$/;
const ready = new Set(['READY', 'READY_WITH_OCCLUSION', 'READY_INTERPRETIVE']);
const row = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string,unknown> : {};
const fail = (code: string): never => { throw new StudioLongformError(code, 403); };
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
/** Preserve the actual selected-memory source set across SceneTruth and the
 * canonical life-movie chapter. Hashes alone do not identify a memory source. */
function sameSourceSet(first: unknown, second: unknown) {
  if (!Array.isArray(first) || !Array.isArray(second) ||
      !first.length || first.length > 256 || first.length !== second.length ||
      first.some(v => typeof v !== 'string' || !ID.test(v)) ||
      second.some(v => typeof v !== 'string' || !ID.test(v))) return false;
  const a = new Set<string>(first), b = new Set<string>(second);
  return a.size === first.length && b.size === second.length &&
    [...a].every(v => b.has(v));
}

function expiration(value: unknown): number {
  if (typeof value === 'string') return Date.parse(value);
  if (typeof value === 'number') return value;
  const date = value as { toMillis?: () => number } | null;
  if (typeof date?.toMillis === 'function') return date.toMillis();
  return NaN;
}

/**
 * Accepts only documents READ BY A PROJECT-PINNED SERVER SDK and status READ
 * THROUGH THE EXISTING OWNER-SCOPED JOBS BRIDGE. Never pass browser-authored
 * JSON into evidence or use matching email addresses as account linkage.
 *
 * Requiring simultaneously authenticated Studio and Spatial sessions links
 * control of both identities for THIS request only; it never creates Studio
 * membership or a persistent account association.
 */
export function assertSpatialLifeMovieBinding(input: {
  studioUid: string; tenantId: string; spatialUid: string;
  memoryId: string; movieId: string; planId: string;
  projectId: string; now?: number;
  user: unknown; memory: unknown; movie: unknown; scene: unknown;
  policy: unknown; consent: unknown; tombstone?: unknown;
  ownerFence?: unknown; barrier?: unknown;
  consentBlock?: unknown; renderConsentBlock?: unknown;
  pendingDeletion: boolean; jobsStatus: unknown;
}) {
  const now = input.now ?? Date.now();
  if (input.projectId !== 'urai-4dc1d' ||
      !ID.test(input.studioUid) || !ID.test(input.tenantId) ||
      !ID.test(input.spatialUid) || !ID.test(input.memoryId) ||
      !ID.test(input.movieId) || !PLAN.test(input.planId)) fail('spatial_identity_or_selector_invalid');

  const user = row(input.user), memory = row(input.memory),
    movie = row(input.movie), scene = row(input.scene),
    policy = row(input.policy), consent = row(input.consent),
    plan = row(row(input.jobsStatus).plan);
  if (user.deleted === true || ['deleting','deleted','disabled'].includes(String(user.accountStatus)) ||
      memory.ownerId !== input.spatialUid || memory.deleted === true ||
      memory.consentState !== 'authorized' || input.pendingDeletion) fail('spatial_memory_authority_denied');
  if (policy.ownerId !== input.spatialUid || policy.version !== 2 ||
      !Number.isSafeInteger(policy.revision) || Number(policy.revision) < 1 ||
      row(row(policy.domains).memory).mode !== 'granted' ||
      row(policy.enforcement).state !== 'fully-enforced') fail('spatial_consent_denied');
  if (consent.uid !== input.spatialUid || consent.purpose !== 'memory.storage' ||
      consent.consentTier !== 'C1' || consent.policyVersion !== '1.0.0' ||
      consent.status !== 'granted' || !SHA.test(String(consent.receiptHash)) ||
      !(expiration(consent.expiresAt) > now)) fail('spatial_consent_denied');

  if (input.tombstone !== undefined) {
    const tombstone = row(input.tombstone);
    if (tombstone.uid !== input.spatialUid || tombstone.active !== false) fail('spatial_owner_deleted');
  }
  if (input.ownerFence !== undefined) {
    const fence = row(input.ownerFence);
    if (fence.ownerHash !== hash(input.spatialUid) ||
        fence.deleted !== false || fence.deletionEpoch !== 0) fail('spatial_owner_deleted');
  }
  if (input.barrier !== undefined && row(input.barrier).blocked !== false) fail('spatial_owner_deleted');
  if (input.consentBlock !== undefined) {
    const block = row(input.consentBlock);
    if (block.ownerUid !== input.spatialUid || block.purpose !== 'memory.storage' ||
        block.active !== false) fail('spatial_consent_denied');
  }
  if (input.renderConsentBlock !== undefined) {
    const block = row(input.renderConsentBlock);
    if (block.ownerUid !== input.spatialUid || block.purpose !== 'life-movie.render' ||
        block.active !== false) fail('spatial_consent_denied');
  }

  if (movie.id !== input.movieId || movie.ownerId !== input.spatialUid ||
      movie.status !== 'ready' || movie.consentState !== 'authorized' ||
      movie.lifeModelSchemaVersion !== 'urai-life-model-v1' ||
      movie.syntheticOutputMayBecomeHistoricalSource !== false ||
      !Array.isArray(movie.chapters) ||
      !movie.chapters.some(ch => {
        const chapter = row(ch);
        return chapter.memoryId === input.memoryId &&
          chapter.consentState === 'authorized' &&
          chapter.sceneTruthPacketId === row(memory.lifeMovie).sceneTruthPacketId &&
          sameSourceSet(row(chapter.provenance).sourceIds,
            row(row(memory.lifeMovie).provenance).sourceIds);
      })) fail('spatial_movie_not_bound_to_memory');

  const packetId = row(memory.lifeMovie).sceneTruthPacketId;
  if (typeof packetId !== 'string' || !ID.test(packetId) ||
      scene.sceneId !== packetId || scene.ownerId !== input.spatialUid ||
      scene.memoryId !== input.memoryId || scene.schemaVersion !== 'urai-life-model-v1' ||
      scene.state !== 'current' || scene.syntheticOutputMayBecomeHistoricalSource !== false ||
      !ready.has(String(scene.decision)) ||
      !SHA.test(String(scene.packetHash)) ||
      !SHA.test(String(scene.memorySourceBindingDigest)) ||
      !sameSourceSet(scene.memorySourceIds,
        row(row(memory.lifeMovie).provenance).sourceIds)) {
    fail('spatial_scene_truth_not_current');
  }
  // Jobs status is returned by Jobs after verifying the exact Studio owner and
  // tenant, not by a caller-supplied plan or public status document.
  const jobsSource = row(plan.sourceBinding);
  if (jobsSource.ownerUid !== input.studioUid ||
      jobsSource.tenantId !== input.tenantId ||
      jobsSource.sourceSystem !== 'urai-studio' ||
      jobsSource.processingPurpose !== 'life-movie.render' ||
      jobsSource.sceneTruthDigest !== scene.packetHash ||
      jobsSource.renderPlanDigest !== plan.renderPlanDigest ||
      typeof jobsSource.sceneTruthReceiptRef !== 'string' ||
      jobsSource.sceneTruthReceiptRef.length === 0 ||
      jobsSource.sceneTruthReceiptRef.length > 512) fail('spatial_jobs_source_binding_mismatch');
  if (row(input.jobsStatus).ok !== true || plan.planId !== input.planId ||
      plan.status !== 'SUCCESS' || plan.consentRevoked !== false ||
      plan.publicReleaseAuthorized !== false ||
      row(plan.assembly).status !== 'SUCCESS' ||
      plan.sceneTruthDigest !== scene.packetHash ||
      !SHA.test(String(plan.renderPlanDigest))) {
    fail('spatial_jobs_source_binding_mismatch');
  }
  return Object.freeze({
    planId: input.planId,
    memoryId: input.memoryId, movieId: input.movieId,
    ownerUid: input.spatialUid, sceneTruthPacketId: packetId,
    sceneTruthDigest: scene.packetHash as string,
  });
}
