import { adminDb, firebaseAdminStatus } from '@/lib/firebase-admin';
import {
  STUDIO_CANONICAL_COLLECTIONS,
  STUDIO_DATA_MODEL_VERSION,
  requireCanonicalStudioRecord,
} from '@/lib/studio/data-model';
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
  projects: STUDIO_CANONICAL_COLLECTIONS.projects,
  briefs: STUDIO_CANONICAL_COLLECTIONS.briefs,
  jobs: STUDIO_CANONICAL_COLLECTIONS.jobs,
  assets: STUDIO_CANONICAL_COLLECTIONS.assets,
  exports: STUDIO_CANONICAL_COLLECTIONS.exports,
} as const;

const DEFAULT_TENANT_ID = 'public-studio';
const DEFAULT_USER_ID = 'anonymous-studio-user';

export type RuntimeStoreMode = 'firebase' | 'unconfigured';

export type CreateStudioJobInput = {
  projectId?: UraiId;
  briefId?: UraiId;
  kind?: StudioJobKind;
  prompt?: string;
  requestedExports?: StudioExportKind[];
  tenantId?: UraiId;
  userId?: UraiId;
};

export type CreateStudioExportInput = {
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
  } as const;
}

export async function createStudioProject(input: Partial<StudioProject> = {}): Promise<RuntimeStoreResponse<StudioProject>> {
  if (!adminDb) {
    return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  }

  const timestamp = nowIso();
  const id = input.id ?? newId('project');
  const project: StudioProject = {
    id,
    schemaVersion: STUDIO_DATA_MODEL_VERSION,
    tenantId: cleanString(input.tenantId, DEFAULT_TENANT_ID),
    userId: cleanString(input.userId, DEFAULT_USER_ID),
    name: cleanString(input.name, 'URAI Studio Project'),
    description: input.description,
    projectType: input.projectType,
    metadata: input.metadata,
    ownerSystem: 'urai-studio',
    linkedSystems: input.linkedSystems ?? ['urai-studio'],
    capabilityKeys: input.capabilityKeys ?? ['V1_GENESIS_HOME'],
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await adminDb.collection(COLLECTIONS.projects).doc(project.id).set(project, { merge: true });
  return { ok: true, mode: 'firebase', data: project };
}

export async function createStudioBrief(input: Partial<StudioBrief> & { projectId: UraiId }): Promise<RuntimeStoreResponse<StudioBrief>> {
  if (!adminDb) {
    return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  }

  const timestamp = nowIso();
  const brief: StudioBrief = {
    id: input.id ?? newId('brief'),
    schemaVersion: STUDIO_DATA_MODEL_VERSION,
    tenantId: cleanString(input.tenantId, DEFAULT_TENANT_ID),
    userId: cleanString(input.userId, DEFAULT_USER_ID),
    projectId: input.projectId,
    title: cleanString(input.title, 'URAI Studio Brief'),
    prompt: cleanString(input.prompt, ''),
    intendedOutputs: input.intendedOutputs ?? ['image', 'script', 'scene_manifest'],
    requestedExports: input.requestedExports ?? ['json'],
    consentRequirements: input.consentRequirements ?? defaultConsentRequirements(),
    safetyBoundaries: input.safetyBoundaries ?? [{ requiredLanguage: 'none', humanReviewRequired: false }],
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await adminDb.collection(COLLECTIONS.briefs).doc(brief.id).set(brief, { merge: true });
  return { ok: true, mode: 'firebase', data: brief };
}

export async function createStudioJob(input: CreateStudioJobInput): Promise<RuntimeStoreResponse<StudioJob>> {
  if (!adminDb) {
    return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  }

  const timestamp = nowIso();
  const projectId = cleanString(input.projectId, newId('project'));
  const job: StudioJob = {
    id: newId('job'),
    schemaVersion: STUDIO_DATA_MODEL_VERSION,
    tenantId: cleanString(input.tenantId, DEFAULT_TENANT_ID),
    userId: cleanString(input.userId, DEFAULT_USER_ID),
    projectId,
    briefId: input.briefId,
    kind: input.kind ?? 'asset_bundle_export',
    status: 'queued',
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

  await adminDb.collection(COLLECTIONS.jobs).doc(job.id).set(job, { merge: true });

  if (input.prompt) {
    await createStudioBrief({
      projectId,
      tenantId: job.tenantId,
      userId: job.userId,
      prompt: input.prompt,
      requestedExports: input.requestedExports ?? ['json'],
    });
  }

  return { ok: true, mode: 'firebase', data: job };
}

export async function createStudioExport(input: CreateStudioExportInput): Promise<RuntimeStoreResponse<StudioExport>> {
  if (!adminDb) {
    return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  }

  const timestamp = nowIso();
  const studioExport: StudioExport = {
    id: newId('export'),
    schemaVersion: STUDIO_DATA_MODEL_VERSION,
    tenantId: cleanString(input.tenantId, DEFAULT_TENANT_ID),
    userId: cleanString(input.userId, DEFAULT_USER_ID),
    projectId: input.projectId,
    jobId: input.jobId,
    assetIds: input.assetIds ?? [],
    kind: input.kind,
    status: 'queued' satisfies StudioJobStatus,
    storagePath: undefined,
    downloadUrl: undefined,
    expiresAt: undefined,
    tenantScoped: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await adminDb.collection(COLLECTIONS.exports).doc(studioExport.id).set(studioExport, { merge: true });
  return { ok: true, mode: 'firebase', data: studioExport };
}

export async function getStudioJob(input: { jobId: UraiId; tenantId: UraiId; userId: UraiId }): Promise<RuntimeStoreResponse<StudioJob>> {
  if (!adminDb) return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  const snapshot = await adminDb.collection(COLLECTIONS.jobs).doc(input.jobId).get();
  if (!snapshot.exists) return { ok: false, mode: 'firebase', error: 'studio_job_not_found' };
  const record = snapshot.data();
  requireCanonicalStudioRecord(record);
  const job = record as StudioJob;
  if (job.tenantId !== input.tenantId || job.userId !== input.userId) {
    return { ok: false, mode: 'firebase', error: 'studio_job_scope_mismatch' };
  }
  return { ok: true, mode: 'firebase', data: job };
}

export async function updateStudioJobExecution(input: {
  jobId: UraiId;
  tenantId: UraiId;
  userId: UraiId;
  status: StudioJobStatus;
  externalJobId?: UraiId;
  externalStatus?: string;
  errorCode?: string;
  errorMessage?: string;
}): Promise<RuntimeStoreResponse<StudioJob>> {
  if (!adminDb) return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  const ref = adminDb.collection(COLLECTIONS.jobs).doc(input.jobId);
  const result = await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error('studio_job_not_found');
    const current = requireCanonicalStudioRecord(snapshot.data()) as StudioJob;
    if (current.tenantId !== input.tenantId || current.userId !== input.userId) throw new Error('studio_job_scope_mismatch');
    const updatedAt = nowIso();
    const patch: Record<string, unknown> = {
      status: input.status,
      updatedAt,
      errorCode: input.errorCode ?? null,
      errorMessage: input.errorMessage ?? null,
    };
    if (input.externalJobId) {
      patch.externalExecution = {
        system: 'urai-jobs',
        jobId: input.externalJobId,
        status: input.externalStatus ?? input.status,
        updatedAt,
      };
    } else if (current.externalExecution && input.externalStatus) {
      patch.externalExecution = {
        ...current.externalExecution,
        status: input.externalStatus,
        updatedAt,
      };
    }
    transaction.set(ref, patch, { merge: true });
    return { ...current, ...patch } as StudioJob;
  }).catch((error) => ({ __error: error instanceof Error ? error.message : 'studio_job_update_failed' } as const));

  if ('__error' in result) return { ok: false, mode: 'firebase', error: result.__error };
  return { ok: true, mode: 'firebase', data: result };
}

export async function listTenantJobs(tenantId = DEFAULT_TENANT_ID): Promise<RuntimeStoreResponse<StudioJob[]>> {
  if (!adminDb) {
    return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  }

  const snapshot = await adminDb
    .collection(COLLECTIONS.jobs)
    .where('tenantId', '==', tenantId)
    .orderBy('createdAt', 'desc')
    .limit(25)
    .get();

  const data = snapshot.docs.map((doc) => {
    const record = doc.data();
    requireCanonicalStudioRecord(record);
    return record as StudioJob;
  });
  return { ok: true, mode: 'firebase', data };
}

export type { StudioAsset, StudioBrief, StudioExport, StudioJob, StudioProject };
