import { adminDb, firebaseAdminStatus } from '@/lib/firebase-admin';
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
    execution: STUDIO_CONTRACT_EXECUTION,
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
  const tenantId = cleanString(input.tenantId, DEFAULT_TENANT_ID);
  const userId = cleanString(input.userId, DEFAULT_USER_ID);

  // A prompt brief is part of the SAME persisted draft, not a separate
  // best-effort follow-up write. Neither record exists if the batch fails.
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
    id: newId('job'),
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

  // Firebase Admin batch commits are atomic: a failed prompt write cannot
  // leave an orphaned job that the API mistakenly reports as unpersisted.
  // This does NOT dispatch a worker or make client retries idempotent.
  const batch = adminDb.batch();
  batch.create(adminDb.collection(COLLECTIONS.jobs).doc(job.id), job);
  if (brief) {
    batch.create(adminDb.collection(COLLECTIONS.briefs).doc(brief.id), brief);
  }
  await batch.commit();

  return { ok: true, mode: 'firebase', data: job };
}

export async function createStudioExport(input: CreateStudioExportInput): Promise<RuntimeStoreResponse<StudioExport>> {
  if (!adminDb) {
    return { ok: false, mode: 'unconfigured', error: 'firebase_admin_unconfigured' };
  }

  const timestamp = nowIso();
  const studioExport: StudioExport = {
    id: newId('export'),
    tenantId: cleanString(input.tenantId, DEFAULT_TENANT_ID),
    userId: cleanString(input.userId, DEFAULT_USER_ID),
    projectId: input.projectId,
    jobId: input.jobId,
    assetIds: input.assetIds ?? [],
    kind: input.kind,
    status: 'draft' satisfies StudioJobStatus,
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

  return { ok: true, mode: 'firebase', data: snapshot.docs.map((doc) => doc.data() as StudioJob) };
}

export type { StudioAsset, StudioBrief, StudioExport, StudioJob, StudioProject };
