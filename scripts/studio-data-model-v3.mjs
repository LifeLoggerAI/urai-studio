export const STUDIO_DATA_MODEL_VERSION = 3;

export const canonicalCollections = Object.freeze({
  studioProjects: 'studioProjects',
  studioAssets: 'studioAssets',
  assetJobs: 'studioJobs',
  exportJobs: 'studioExports',
  studioEvents: 'studioEvidence',
});

export const legacyOnlyCollections = Object.freeze([
  'studioScenes',
  'assetCollections',
  'studioScrolls',
  'narratorScripts',
  'subtitles',
  'voiceoverJobs',
  'xrSessions',
  'vrSessions',
]);

function documentId(value, field) {
  if (typeof value !== 'string' || !value || value.trim() !== value || value.includes('/') || value === '.' || value === '..') {
    throw new Error(`invalid_${field}`);
  }
  return value;
}

function iso(value, fallback) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

function sourceIdentity(collection, id, data) {
  return {
    collection,
    id,
    uid: typeof data.uid === 'string' ? data.uid : null,
  };
}

function legacyAssetKind(value) {
  const map = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    script: 'script',
    subtitle: 'subtitle',
    scroll: 'storyboard',
    scene: 'scene_manifest',
    model: 'three_component',
  };
  return typeof value === 'string' ? map[value] ?? null : null;
}

function legacyJobKind(value) {
  const map = {
    image: 'image_generation',
    video: 'video_generation',
    scroll: 'scroll_export',
    scene: 'three_scene_generation',
    model: 'three_scene_generation',
  };
  return typeof value === 'string' ? map[value] ?? null : null;
}

function legacyExportKind(value) {
  const map = {
    manifest: 'json',
    json: 'json',
    pdf: 'pdf',
    zip: 'zip',
    mp4: 'mp4',
    srt: 'srt',
  };
  return typeof value === 'string' ? map[value] ?? null : null;
}

export function classifyLegacyRecord(collection, id, data) {
  documentId(collection, 'collection');
  documentId(id, 'record_id');
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid_record');
  if (data.schemaVersion === STUDIO_DATA_MODEL_VERSION && typeof data.tenantId === 'string' && typeof data.userId === 'string') {
    return { state: 'canonical-v3', targetCollection: collection };
  }
  if (typeof data.uid !== 'string' || !data.uid) return { state: 'unmapped', targetCollection: null };
  if (Object.hasOwn(canonicalCollections, collection)) return { state: 'convertible', targetCollection: canonicalCollections[collection] };
  if (legacyOnlyCollections.includes(collection)) return { state: 'compatibility-only', targetCollection: null };
  return { state: 'unmapped', targetCollection: null };
}

export function convertLegacyRecord({ collection, id, data, tenantId, migratedAt }) {
  const classification = classifyLegacyRecord(collection, id, data);
  if (classification.state !== 'convertible') {
    return {
      ok: false,
      classification,
      reason: classification.state === 'compatibility-only' ? 'explicit_mapping_required' : 'record_not_convertible',
    };
  }

  const userId = documentId(data.uid, 'legacy_uid');
  const resolvedTenantId = documentId(tenantId, 'tenant_id');
  const timestamp = iso(migratedAt, new Date(0).toISOString());
  const provenance = {
    migratedFrom: sourceIdentity(collection, id, data),
    migratedAt: timestamp,
    migrationVersion: STUDIO_DATA_MODEL_VERSION,
  };

  if (collection === 'studioProjects') {
    return {
      ok: true,
      classification,
      targetCollection: 'studioProjects',
      targetId: id,
      record: {
        id,
        schemaVersion: STUDIO_DATA_MODEL_VERSION,
        tenantId: resolvedTenantId,
        userId,
        name: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'Migrated Studio Project',
        description: typeof data.description === 'string' ? data.description : undefined,
        ownerSystem: 'urai-studio',
        linkedSystems: ['urai-studio'],
        capabilityKeys: ['V1_GENESIS_HOME'],
        migration: provenance,
        createdAt: iso(data.createdAt, timestamp),
        updatedAt: timestamp,
      },
    };
  }

  if (collection === 'studioAssets') {
    const kind = legacyAssetKind(data.type);
    if (!kind) return { ok: false, classification, reason: 'explicit_asset_kind_mapping_required' };
    if (typeof data.storagePath !== 'string' || !data.storagePath.trim()) {
      return { ok: false, classification, reason: 'asset_storage_path_required' };
    }
    return {
      ok: true,
      classification,
      targetCollection: 'studioAssets',
      targetId: id,
      record: {
        id,
        schemaVersion: STUDIO_DATA_MODEL_VERSION,
        tenantId: resolvedTenantId,
        userId,
        projectId: typeof data.projectId === 'string' && data.projectId ? data.projectId : 'legacy-unbound',
        kind,
        title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'Migrated Studio Asset',
        storagePath: typeof data.storagePath === 'string' ? data.storagePath : '',
        mimeType: typeof data.mimeType === 'string' ? data.mimeType : 'application/octet-stream',
        generationMetadata: { migration: provenance },
        consentRequirements: [],
        safetyBoundaries: [{ requiredLanguage: 'none', humanReviewRequired: true, policyId: 'legacy-migration-review' }],
        createdAt: iso(data.createdAt, timestamp),
        updatedAt: timestamp,
      },
    };
  }

  if (collection === 'assetJobs') {
    const kind = legacyJobKind(data.type);
    if (!kind) return { ok: false, classification, reason: 'explicit_job_kind_mapping_required' };
    return {
      ok: true,
      classification,
      targetCollection: 'studioJobs',
      targetId: id,
      record: {
        id,
        schemaVersion: STUDIO_DATA_MODEL_VERSION,
        tenantId: resolvedTenantId,
        userId,
        projectId: typeof data.projectId === 'string' && data.projectId ? data.projectId : 'legacy-unbound',
        kind,
        status: data.status === 'failed' ? 'failed' : data.status === 'ready' ? 'succeeded' : 'queued',
        provider: 'legacy-migration',
        model: 'compatibility-only',
        inputAssetIds: [],
        outputAssetIds: typeof data.outputAssetId === 'string' ? [data.outputAssetId] : [],
        requestedExportIds: [],
        consentRequirements: [],
        safetyBoundaries: [{ requiredLanguage: 'none', humanReviewRequired: true, policyId: 'legacy-migration-review' }],
        migration: provenance,
        createdAt: iso(data.createdAt, timestamp),
        updatedAt: timestamp,
      },
    };
  }

  if (collection === 'exportJobs') {
    const kind = legacyExportKind(data.type);
    if (!kind) return { ok: false, classification, reason: 'explicit_export_kind_mapping_required' };
    return {
      ok: true,
      classification,
      targetCollection: 'studioExports',
      targetId: id,
      record: {
        id,
        schemaVersion: STUDIO_DATA_MODEL_VERSION,
        tenantId: resolvedTenantId,
        userId,
        projectId: typeof data.projectId === 'string' && data.projectId ? data.projectId : 'legacy-unbound',
        assetIds: [],
        kind,
        status: data.exportStatus === 'ready' ? 'succeeded' : data.exportStatus === 'failed' ? 'failed' : 'queued',
        storagePath: typeof data.storagePath === 'string' ? data.storagePath : undefined,
        tenantScoped: true,
        publicReleaseAuthorized: false,
        migration: provenance,
        createdAt: iso(data.createdAt, timestamp),
        updatedAt: timestamp,
      },
    };
  }

  if (collection === 'studioEvents') {
    return {
      ok: true,
      classification,
      targetCollection: 'studioEvidence',
      targetId: id,
      record: {
        id,
        schemaVersion: STUDIO_DATA_MODEL_VERSION,
        tenantId: resolvedTenantId,
        userId,
        evidenceType: 'legacy-event',
        source: sourceIdentity(collection, id, data),
        eventType: typeof data.type === 'string' ? data.type : 'legacy-event',
        projectId: typeof data.projectId === 'string' ? data.projectId : null,
        migration: provenance,
        createdAt: iso(data.createdAt, timestamp),
        updatedAt: timestamp,
      },
    };
  }

  return { ok: false, classification, reason: 'unsupported_mapping' };
}

export function createDryRunPlan(records, tenantByUid, migratedAt) {
  const writes = [];
  const blocked = [];
  for (const entry of records) {
    const uid = entry?.data?.uid;
    const tenantId = typeof uid === 'string' ? tenantByUid[uid] : undefined;
    if (!tenantId) {
      blocked.push({ collection: entry.collection, id: entry.id, reason: 'tenant_mapping_required' });
      continue;
    }
    const converted = convertLegacyRecord({ ...entry, tenantId, migratedAt });
    if (converted.ok) writes.push(converted);
    else blocked.push({ collection: entry.collection, id: entry.id, reason: converted.reason });
  }
  return {
    schemaVersion: STUDIO_DATA_MODEL_VERSION,
    dryRun: true,
    productionMutationAuthorized: false,
    writes,
    blocked,
  };
}

export function createRollbackReceipt(plan) {
  if (!plan || plan.dryRun !== true || plan.productionMutationAuthorized !== false) throw new Error('invalid_migration_plan');
  return {
    schemaVersion: STUDIO_DATA_MODEL_VERSION,
    rollbackRequired: true,
    productionMutationAuthorized: false,
    sourceRecords: plan.writes.map((write) => write.record.migration?.migratedFrom ?? write.record.source),
    targetRecords: plan.writes.map((write) => ({ collection: write.targetCollection, id: write.targetId })),
  };
}
