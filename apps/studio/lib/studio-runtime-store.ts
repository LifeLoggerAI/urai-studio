import { adminDb, firebaseAdminStatus } from '@/lib/firebase-admin';
import { assertStudioDraftAuthorityInTransaction } from '@/lib/studio-member-auth';
import { deriveStudioDraftReceipt, deriveStudioExportReceipt } from '@/lib/studio-draft-idempotency';
import {
  consentRequired,
  type ConsentRequirement,
  type StudioAsset,
  type StudioBrief,
  type StudioExport,
  type StudioExportKind,
  type StudioJob,
  type StudioJobKind,
  type StudioJobStatus,
  type StudioProject,
  type UraiId,
} from '@/lib/urai-system-contract';

const COLLECTIONS = {
  projects: 'studioProjects',
  briefs: 'studioBriefs',
  jobs: 'studioJobs',
  assets: 'studioAssets',
  exports: 'studioExports',
} as const;

const DEFAULT_TENANT_ID = 'public-studio';
const DEFAULT_USER_ID = 'anonymous-studio-user';

// Persistence is not worker admission. This Store currently records contracts
// but does not dispatch generation, validate media, or authorize private render.
// Expose one unambiguous receipt across jobs, exports and Video Factory.
export const STUDIO_CONTRACT_EXECUTION = Object.freeze({
  mode: 'contract-only',
  workerDispatched: false,
  outputVerified: false,
  mediaRendered: false,
  privateRenderConsentAuthorized: false,
} as const);

export type RuntimeStoreMode = 'firebase' | 'unconfigured';

export type CreateStudioJobInput = {
  /** Required by public POST routes; optional for historical internal callers. */
  idempotencyKey?: string;
  projectId?: UraiId;
  briefId?: UraiId;
  kind?: StudioJobKind;
  prompt?: string;
  requestedExports?: StudioExportKind[];
  tenantId?: UraiId;
  userId?: UraiId;
};

export type CreateStudioExportInput = {
  idempotencyKey?: string;
  projectId: UraiId;
  jobId?: UraiId;
  assetIds?: UraiId[];
  kind: StudioExportKind;
  tenantId?: UraiId;
  userId?: UraiId;
};

export type RuntimeStoreResponse<T> = {
  ok: boolean;
  mode: RuntimeStoreMode;
  data?: T;
  /** True only when the original committed draft was reused. */
  replayed?: boolean;
  error?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function cleanString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function defaultConsentRequirements(): ConsentRequirement[] {
  return [consentRequired('generated_assets', 'Create and export URAI Studio generated assets.')];
}

export function runtimeStoreStatus() {
  return {
    mode: adminDb ? 'firebase' : 'unconfigured',
    firebaseAdmin: firebaseAdminStatus,
    collections: COLLECTIONS,
    tenantScoped: true,
    execution: STUDIO_CONTRACT_EXECUTION,
  } as const;
}

export async function createStudioProject(input: Partial<StudioProject> = {}): Promise<RuntimeStoreResponse<StudioProject>> {
  if (!adminDb) {
    return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  }

  const timestamp = nowIso();
  const id = input.id ?? newId('project');
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(id)) {
    return { ok: false, mode: 'firebase', error: 'studio_reference_unavailable' };
  }
  const project: StudioProject = {
    id,
    tenantId: cleanString(input.tenantId, DEFAULT_TENANT_ID),
    userId: cleanString(input.userId, DEFAULT_USER_ID),
    name: cleanString(input.name, 'URAI Studio Project'),
    description: input.description,
    ownerSystem: 'urai-studio',
    linkedSystems: input.linkedSystems ?? ['urai-studio'],
    capabilityKeys: input.capabilityKeys ?? ['V1_GENESIS_HOME'],
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  // Creation is never a caller-selected upsert into another owner's ID.
  // Existing IDs must fail rather than silently replacing historical records.
  await adminDb.collection(COLLECTIONS.projects).doc(project.id).create(project);
  return { ok: true, mode: 'firebase', data: project };
}

export async function createStudioBrief(input: Partial<StudioBrief> & { projectId: UraiId }): Promise<RuntimeStoreResponse<StudioBrief>> {
  if (!adminDb) {
    return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  }

  const timestamp = nowIso();
  const tenantId = cleanString(input.tenantId, DEFAULT_TENANT_ID);
  const userId = cleanString(input.userId, DEFAULT_USER_ID);
  const projectId = input.projectId.trim();
  const brief: StudioBrief = {
    id: input.id ?? newId('brief'),
    tenantId,
    userId,
    projectId,
    title: cleanString(input.title, 'URAI Studio Brief'),
    prompt: cleanString(input.prompt, ''),
    intendedOutputs: input.intendedOutputs ?? ['image', 'script', 'scene_manifest'],
    requestedExports: input.requestedExports ?? ['json'],
    consentRequirements: input.consentRequirements ?? defaultConsentRequirements(),
    safetyBoundaries: input.safetyBoundaries ?? [{ requiredLanguage: 'none', humanReviewRequired: false }],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // Existing projects must belong to this exact tenant AND user before a
  // standalone brief is created. No implicit legacy uid->userId conversion.
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(projectId) ||
      !/^[A-Za-z0-9_-]{1,160}$/.test(brief.id)) {
    return { ok: false, mode: 'firebase', error: 'studio_reference_unavailable' };
  }
  const projectRef = adminDb.collection(COLLECTIONS.projects).doc(projectId);
  try {
    await adminDb.runTransaction(async transaction => {
      await assertStudioDraftAuthorityInTransaction(transaction, userId, tenantId);
      const currentProject = await transaction.get(projectRef);
      const data = currentProject.data();
      if (!currentProject.exists || data?.tenantId !== tenantId || data?.userId !== userId) {
        throw new Error('studio_reference_unavailable');
      }
      transaction.create(adminDb.collection(COLLECTIONS.briefs).doc(brief.id), brief);
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'studio_reference_unavailable') {
      return { ok: false, mode: 'firebase', error: 'studio_reference_unavailable' };
    }
    throw error;
  }
  return { ok: true, mode: 'firebase', data: brief };
}

export async function createStudioJob(input: CreateStudioJobInput): Promise<RuntimeStoreResponse<StudioJob>> {
  if (!adminDb) {
    return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  }

  const timestamp = nowIso();
  const requestedProjectId = typeof input.projectId === 'string' ? input.projectId.trim() : '';
  const projectId = requestedProjectId || newId('project');
  const tenantId = cleanString(input.tenantId, DEFAULT_TENANT_ID);
  const userId = cleanString(input.userId, DEFAULT_USER_ID);
  const idempotency = input.idempotencyKey
    ? deriveStudioDraftReceipt({
        tenantId, userId, key: input.idempotencyKey,
        projectId: requestedProjectId, briefId: input.briefId,
        kind: input.kind ?? 'asset_bundle_export',
        prompt: input.prompt ?? '',
        requestedExports: input.requestedExports ?? ['json'],
      })
    : undefined;

  // An implicit project is an actual owned StudioProject, not a dangling ID.
  const project: StudioProject | undefined = requestedProjectId
    ? undefined
    : {
        id: projectId,
        tenantId,
        userId,
        name: 'URAI Studio Project',
        ownerSystem: 'urai-studio',
        linkedSystems: ['urai-studio'],
        capabilityKeys: ['V1_GENESIS_HOME'],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

  const brief: StudioBrief | undefined = input.prompt
    ? {
        id: newId('brief'),
        tenantId,
        userId,
        projectId,
        title: 'URAI Studio Brief',
        prompt: cleanString(input.prompt, ''),
        intendedOutputs: ['image', 'script', 'scene_manifest'],
        requestedExports: input.requestedExports ?? ['json'],
        consentRequirements: defaultConsentRequirements(),
        safetyBoundaries: [{ requiredLanguage: 'none', humanReviewRequired: false }],
        createdAt: timestamp,
        updatedAt: timestamp,
      }
    : undefined;

  const job: StudioJob = {
    id: idempotency?.jobId ?? newId('job'),
    ...(idempotency ? { idempotencyKeyDigest: idempotency.keyDigest, idempotencyRequestDigest: idempotency.requestDigest } : {}),
    tenantId,
    userId,
    projectId,
    ...(brief ? { briefId: brief.id } : input.briefId ? { briefId: input.briefId } : {}),
    kind: input.kind ?? 'asset_bundle_export',
    status: 'draft',
    provider: 'feature-gated',
    model: 'contract-only',
    inputAssetIds: [],
    outputAssetIds: [],
    requestedExportIds: [],
    consentRequirements: defaultConsentRequirements(),
    safetyBoundaries: [{ requiredLanguage: 'none', humanReviewRequired: false }],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // All project/brief authorization reads happen within the SAME Firestore
  // transaction as draft creation, preventing a change between check/write.
  // No renderer, source media or Jobs worker is admitted here.
  const projectRef = adminDb.collection(COLLECTIONS.projects).doc(projectId);
  const existingBriefRef = !brief && input.briefId
    ? adminDb.collection(COLLECTIONS.briefs).doc(input.briefId)
    : undefined;
  let persisted: { job: StudioJob; replayed: boolean };
  try {
    persisted = await adminDb.runTransaction(async transaction => {
    await assertStudioDraftAuthorityInTransaction(transaction, userId, tenantId);
    // Check the deterministic job identity in the SAME commit-validated read
    // set. A retry after a lost HTTP response returns the original receipt.
    // A reused key with different content is a hard conflict.
    if (idempotency) {
      const prior = await transaction.get(adminDb.collection(COLLECTIONS.jobs).doc(idempotency.jobId));
      if (prior.exists) {
        const previous = prior.data() as StudioJob | undefined;
        if (previous?.id !== idempotency.jobId ||
            previous?.tenantId !== tenantId || previous?.userId !== userId ||
            previous?.kind !== (input.kind ?? 'asset_bundle_export') ||
            (requestedProjectId !== '' && previous?.projectId !== requestedProjectId) ||
            (input.prompt ? !previous?.briefId : previous?.briefId !== input.briefId) ||
            !Array.isArray(previous?.inputAssetIds) || previous.inputAssetIds.length !== 0 ||
            !Array.isArray(previous?.outputAssetIds) || previous.outputAssetIds.length !== 0 ||
            !Array.isArray(previous?.requestedExportIds) || previous.requestedExportIds.length !== 0 ||
            previous?.idempotencyKeyDigest !== idempotency.keyDigest ||
            previous?.idempotencyRequestDigest !== idempotency.requestDigest ||
            previous?.status !== 'draft' || previous?.provider !== 'feature-gated' ||
            previous?.model !== 'contract-only') {
          throw new Error('studio_idempotency_conflict');
        }
        // A reusable receipt must not outlive its owner-bound source records.
        // A deleted/reassigned project or brief invalidates the replay.
        const priorProject = await transaction.get(
          adminDb.collection(COLLECTIONS.projects).doc(previous.projectId));
        const projectData = priorProject.data();
        if (!priorProject.exists || projectData?.tenantId !== tenantId ||
            projectData?.userId !== userId) {
          throw new Error('studio_idempotency_conflict');
        }
        if (previous.briefId) {
          const priorBrief = await transaction.get(
            adminDb.collection(COLLECTIONS.briefs).doc(previous.briefId));
          const briefData = priorBrief.data();
          const expectedExports = input.requestedExports ?? ['json'];
          if (!priorBrief.exists || briefData?.tenantId !== tenantId ||
              briefData?.userId !== userId || briefData?.projectId !== previous.projectId ||
              (input.prompt && (briefData?.prompt !== cleanString(input.prompt, '') ||
                !Array.isArray(briefData?.requestedExports) ||
                briefData.requestedExports.length !== expectedExports.length ||
                briefData.requestedExports.some((value: string, index: number) =>
                  value !== expectedExports[index])))) {
            throw new Error('studio_idempotency_conflict');
          }
        }
        return { job: previous, replayed: true };
      }
    }
    const currentProject = project ? undefined : await transaction.get(projectRef);
    const currentBrief = existingBriefRef ? await transaction.get(existingBriefRef) : undefined;

    if (!project) {
      if (!currentProject?.exists) throw new Error('studio_project_not_found');
      const persisted = currentProject.data();
      if (persisted?.tenantId !== tenantId || persisted?.userId !== userId) {
        throw new Error('studio_project_forbidden');
      }
    }
    if (existingBriefRef) {
      if (!currentBrief?.exists) throw new Error('studio_brief_not_found');
      const persistedBrief = currentBrief.data();
      if (persistedBrief?.tenantId !== tenantId || persistedBrief?.userId !== userId ||
          persistedBrief?.projectId !== projectId) {
        throw new Error('studio_brief_forbidden');
      }
    }

    if (project) transaction.create(projectRef, project);
    if (brief) transaction.create(adminDb.collection(COLLECTIONS.briefs).doc(brief.id), brief);
    transaction.create(adminDb.collection(COLLECTIONS.jobs).doc(job.id), job);
    return { job, replayed: false };
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'studio_idempotency_conflict') {
      return { ok: false, mode: 'firebase', error: 'studio_idempotency_conflict' };
    }
    throw error;
  }

  return { ok: true, mode: 'firebase', data: persisted.job, replayed: persisted.replayed };
}

export async function createStudioExport(input: CreateStudioExportInput): Promise<RuntimeStoreResponse<StudioExport>> {
  if (!adminDb) {
    return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  }

  const projectId = typeof input.projectId === 'string' ? input.projectId.trim() : '';
  const tenantId = cleanString(input.tenantId, DEFAULT_TENANT_ID);
  const userId = cleanString(input.userId, DEFAULT_USER_ID);
  const jobId = typeof input.jobId === 'string' && input.jobId.trim()
    ? input.jobId.trim() : undefined;
  const assetIds = input.assetIds ?? [];
  const validId = (id: string) => /^[A-Za-z0-9_-]{1,160}$/.test(id);
  // Never let arbitrary caller path fragments escape their intended collection.
  if (!validId(projectId) || (jobId !== undefined && !validId(jobId)) ||
      assetIds.length > 25 || assetIds.some(id => typeof id !== 'string' || !validId(id)) ||
      new Set(assetIds).size !== assetIds.length) {
    return { ok: false, mode: 'firebase', error: 'studio_reference_unavailable' };
  }

  const idempotency = input.idempotencyKey
    ? deriveStudioExportReceipt({
        tenantId, userId, key: input.idempotencyKey, projectId,
        jobId, assetIds, kind: input.kind,
      })
    : undefined;

  const timestamp = nowIso();
  const studioExport: StudioExport = {
    id: idempotency?.exportId ?? newId('export'),
    ...(idempotency ? { idempotencyKeyDigest: idempotency.keyDigest, idempotencyRequestDigest: idempotency.requestDigest } : {}),
    tenantId,
    userId,
    projectId,
    jobId,
    assetIds,
    kind: input.kind,
    status: 'draft' satisfies StudioJobStatus,
    storagePath: undefined,
    downloadUrl: undefined,
    expiresAt: undefined,
    tenantScoped: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const projectRef = adminDb.collection(COLLECTIONS.projects).doc(projectId);
  const jobRef = jobId ? adminDb.collection(COLLECTIONS.jobs).doc(jobId) : undefined;
  const assetRefs = assetIds.map(id => adminDb.collection(COLLECTIONS.assets).doc(id));
  try {
    const persisted = await adminDb.runTransaction(async transaction => {
      await assertStudioDraftAuthorityInTransaction(transaction, userId, tenantId);
      // A retry reads the original export as part of this transaction. Still
      // validate its referenced project/job/assets before returning it.
      const prior = idempotency
        ? await transaction.get(adminDb.collection(COLLECTIONS.exports).doc(idempotency.exportId))
        : undefined;
      if (prior?.exists) {
        const old = prior.data() as StudioExport | undefined;
        if (!old || old.id !== idempotency?.exportId ||
            old.tenantId !== tenantId || old.userId !== userId ||
            old.projectId !== projectId || old.jobId !== jobId ||
            old.kind !== input.kind || old.tenantScoped !== true ||
            !Array.isArray(old.assetIds) || old.assetIds.length !== assetIds.length ||
            old.assetIds.some((id: string, index: number) => id !== assetIds[index]) ||
            old.idempotencyKeyDigest !== idempotency?.keyDigest ||
            old.idempotencyRequestDigest !== idempotency?.requestDigest ||
            old.status !== 'draft' || old.downloadUrl !== undefined ||
            old.storagePath !== undefined || old.expiresAt !== undefined) {
          throw new Error('studio_idempotency_conflict');
        }
      }
      const projectSnap = await transaction.get(projectRef);
      const project = projectSnap.data();
      if (!projectSnap.exists || project?.tenantId !== tenantId || project?.userId !== userId) {
        throw new Error('studio_reference_unavailable');
      }

      const jobSnap = jobRef ? await transaction.get(jobRef) : undefined;
      const assetSnaps = await Promise.all(assetRefs.map(ref => transaction.get(ref)));
      if (jobRef && (!jobSnap?.exists || jobSnap.data()?.tenantId !== tenantId ||
          jobSnap.data()?.userId !== userId || jobSnap.data()?.projectId !== projectId)) {
        throw new Error('studio_reference_unavailable');
      }
      for (const assetSnap of assetSnaps) {
        const asset = assetSnap.data();
        if (!assetSnap.exists || asset?.tenantId !== tenantId ||
            asset?.userId !== userId || asset?.projectId !== projectId) {
          throw new Error('studio_reference_unavailable');
        }
      }
      if (prior?.exists) {
        return { data: prior.data() as StudioExport, replayed: true };
      }
      transaction.create(adminDb.collection(COLLECTIONS.exports).doc(studioExport.id), studioExport);
      return { data: studioExport, replayed: false };
    });
    return { ok: true, mode: 'firebase', data: persisted.data, replayed: persisted.replayed };
  } catch (error) {
    if (error instanceof Error && [
      'studio_reference_unavailable', 'studio_idempotency_conflict',
    ].includes(error.message)) {
      return { ok: false, mode: 'firebase', error: error.message };
    }
    throw error;
  }
}

export async function listTenantJobs(tenantId: UraiId, userId: UraiId): Promise<RuntimeStoreResponse<StudioJob[]>> {
  if (!adminDb) {
    return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  }

  const snapshot = await adminDb
    .collection(COLLECTIONS.jobs)
    .where('tenantId', '==', tenantId)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(25)
    .get();

  return { ok: true, mode: 'firebase', data: snapshot.docs.map((doc) => doc.data() as StudioJob) };
}

export type { StudioAsset, StudioBrief, StudioExport, StudioJob, StudioProject };
