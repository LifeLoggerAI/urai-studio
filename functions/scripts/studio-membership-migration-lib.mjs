import { createHash } from 'node:crypto';
import admin from 'firebase-admin';

export const MIGRATION_MANIFEST_SCHEMA = 1;
export const MIGRATION_RECEIPT_SCHEMA = 2;
export const CANONICAL_MEMBERSHIP_SCHEMA = 2;
export const MAX_ATOMIC_MEMBERSHIPS = 400;
export const ROLES = Object.freeze(['owner', 'admin', 'editor', 'reviewer', 'viewer']);
export const STATUSES = Object.freeze(['active', 'suspended', 'revoked']);

function plainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (plainObject(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function stableJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : stableJson(value)).digest('hex');
}

export function normalizeFirestoreValue(value) {
  if (value === undefined) return null;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return {__uraiFirestoreValue: {type: 'number', value: 'NaN'}};
    if (value === Number.POSITIVE_INFINITY) return {__uraiFirestoreValue: {type: 'number', value: 'Infinity'}};
    if (value === Number.NEGATIVE_INFINITY) return {__uraiFirestoreValue: {type: 'number', value: '-Infinity'}};
    return value;
  }
  if (Array.isArray(value)) return value.map(normalizeFirestoreValue);
  if (value instanceof admin.firestore.Timestamp) {
    return {__uraiFirestoreValue: {type: 'timestamp', value: {seconds: value.seconds, nanoseconds: value.nanoseconds}}};
  }
  if (value instanceof admin.firestore.DocumentReference) {
    return {__uraiFirestoreValue: {type: 'reference', value: value.path}};
  }
  if (value instanceof admin.firestore.GeoPoint) {
    return {__uraiFirestoreValue: {type: 'geoPoint', value: {latitude: value.latitude, longitude: value.longitude}}};
  }
  if (Buffer.isBuffer(value)) return {__uraiFirestoreValue: {type: 'bytes', value: value.toString('base64')}};
  if (value instanceof admin.firestore.VectorValue) {
    return {__uraiFirestoreValue: {type: 'vector', value: value.toArray().map(normalizeFirestoreValue)}};
  }
  if (plainObject(value)) {
    return {__uraiFirestoreValue: {
      type: 'map',
      value: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeFirestoreValue(item)])),
    }};
  }
  return String(value);
}

export function normalizeFirestoreDocument(value) {
  if (!plainObject(value)) throw new Error('Firestore document root must be a plain object');
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeFirestoreValue(item)]));
}

export function validDocumentSegment(value, maxBytes = 256) {
  return typeof value === 'string'
    && value.trim() === value
    && value.length > 0
    && value !== '.'
    && value !== '..'
    && !value.includes('/')
    && Buffer.byteLength(value, 'utf8') <= maxBytes;
}

function evidenceRef(value) {
  return typeof value === 'string' && value.trim() === value && value.length >= 8 && value.length <= 512;
}

function key(uid, studioId) {
  return `${Buffer.from(uid).toString('base64url')}.${Buffer.from(studioId).toString('base64url')}`;
}

export function validateAuthorityManifest(manifest, inventory, expectedProjectId) {
  const errors = [];
  if (!plainObject(manifest)) return {ok: false, errors: ['manifest must be a JSON object'], entries: []};
  if (manifest.schemaVersion !== MIGRATION_MANIFEST_SCHEMA) errors.push(`schemaVersion must equal ${MIGRATION_MANIFEST_SCHEMA}`);
  if (!validDocumentSegment(manifest.projectId)) errors.push('projectId must be a valid document identifier');
  if (manifest.projectId !== expectedProjectId) errors.push('manifest projectId does not match the explicitly selected project');
  if (typeof manifest.approvedBy !== 'string' || !manifest.approvedBy.trim()) errors.push('approvedBy is required and must identify the real approving authority');
  const approvedAt = Date.parse(manifest.approvedAt);
  if (!Number.isFinite(approvedAt) || new Date(approvedAt).toISOString() !== manifest.approvedAt) errors.push('approvedAt must be an exact ISO-8601 timestamp');
  if (!evidenceRef(manifest.approvalEvidenceRef)) errors.push('approvalEvidenceRef must be an opaque 8-512 character reference');

  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
  const rejectedLegacy = Array.isArray(manifest.rejectedLegacyMemberships) ? manifest.rejectedLegacyMemberships : [];
  const rejectedCanonical = Array.isArray(manifest.rejectedCanonicalMemberships) ? manifest.rejectedCanonicalMemberships : [];
  const rejectedStudios = Array.isArray(manifest.rejectedStudios) ? manifest.rejectedStudios : [];
  if (!Array.isArray(manifest.entries) || entries.length === 0) errors.push('entries must contain at least one verified membership');
  if (!Array.isArray(manifest.rejectedLegacyMemberships)) errors.push('rejectedLegacyMemberships must be an array');
  if (!Array.isArray(manifest.rejectedCanonicalMemberships)) errors.push('rejectedCanonicalMemberships must be an array');
  if (!Array.isArray(manifest.rejectedStudios)) errors.push('rejectedStudios must be an array');
  if (entries.length > MAX_ATOMIC_MEMBERSHIPS) errors.push(`entries exceed the atomic limit of ${MAX_ATOMIC_MEMBERSHIPS}`);

  const studios = new Map((inventory.studios ?? []).map((item) => [item.id, item]));
  const legacy = new Map((inventory.legacyMemberships ?? []).map((item) => [item.id, item]));
  const accountedLegacy = new Set();
  const canonicalKeys = new Set();
  const accountedCanonicalPaths = new Set();
  const acceptedStudioIds = new Set();
  const rejectedStudioIds = new Set();
  const ownerCounts = new Map();

  for (const [index, entry] of entries.entries()) {
    const label = `entries[${index}]`;
    if (!plainObject(entry)) { errors.push(`${label} must be an object`); continue; }
    if (!validDocumentSegment(entry.uid)) errors.push(`${label}.uid must be a valid canonical member document id`);
    if (!validDocumentSegment(entry.studioId)) errors.push(`${label}.studioId must be a valid Studio document id`);
    if (!ROLES.includes(entry.role)) errors.push(`${label}.role is unsupported`);
    if (!STATUSES.includes(entry.status)) errors.push(`${label}.status is unsupported`);
    if (!evidenceRef(entry.authorityEvidenceRef)) errors.push(`${label}.authorityEvidenceRef must be an opaque 8-512 character reference`);
    if (!Array.isArray(entry.legacyDocumentIds)) errors.push(`${label}.legacyDocumentIds must be an array (empty is allowed only with explicit authority evidence)`);
    const canonicalKey = key(String(entry.uid), String(entry.studioId));
    if (canonicalKeys.has(canonicalKey)) errors.push(`${label} duplicates a canonical uid/studioId pair`);
    canonicalKeys.add(canonicalKey);
    accountedCanonicalPaths.add(`studios/${entry.studioId}/members/${entry.uid}`);
    acceptedStudioIds.add(entry.studioId);
    if (!studios.has(entry.studioId)) errors.push(`${label} references a missing Studio document`);
    if (entry.role === 'owner' && entry.status === 'active') ownerCounts.set(entry.studioId, (ownerCounts.get(entry.studioId) ?? 0) + 1);

    for (const legacyId of entry.legacyDocumentIds ?? []) {
      if (!validDocumentSegment(legacyId, 1500)) { errors.push(`${label} contains an invalid legacy document id`); continue; }
      if (accountedLegacy.has(legacyId)) errors.push(`legacy membership ${legacyId} is accounted more than once`);
      accountedLegacy.add(legacyId);
      const source = legacy.get(legacyId);
      if (!source) errors.push(`${label} references missing legacy membership ${legacyId}`);
      else if (source.data?.uid !== entry.uid || source.data?.studioId !== entry.studioId) errors.push(`${label} legacy membership ${legacyId} identity/Studio fields do not match; client role/status fields are intentionally not trusted`);
    }
  }

  const canonical = new Map((inventory.canonicalMemberships ?? []).map((item) => [item.path, item]));
  for (const [index, rejection] of rejectedCanonical.entries()) {
    const label = `rejectedCanonicalMemberships[${index}]`;
    if (!plainObject(rejection) || !validDocumentSegment(rejection.uid) || !validDocumentSegment(rejection.studioId)) {
      errors.push(`${label} must identify a valid uid and studioId`);
      continue;
    }
    if (!evidenceRef(rejection.authorityEvidenceRef) || typeof rejection.reason !== 'string' || rejection.reason.trim().length < 8) {
      errors.push(`${label} requires a meaningful reason and authorityEvidenceRef`);
    }
    const canonicalPath = `studios/${rejection.studioId}/members/${rejection.uid}`;
    if (!canonical.has(canonicalPath)) errors.push(`${label} references a missing canonical membership`);
    if (accountedCanonicalPaths.has(canonicalPath)) errors.push(`canonical membership ${canonicalPath} is accounted more than once`);
    accountedCanonicalPaths.add(canonicalPath);
  }

  for (const [index, rejection] of rejectedLegacy.entries()) {
    const label = `rejectedLegacyMemberships[${index}]`;
    if (!plainObject(rejection) || !validDocumentSegment(rejection.documentId, 1500)) { errors.push(`${label}.documentId is invalid`); continue; }
    if (!evidenceRef(rejection.authorityEvidenceRef) || typeof rejection.reason !== 'string' || rejection.reason.trim().length < 8) errors.push(`${label} requires a meaningful reason and authorityEvidenceRef`);
    if (!legacy.has(rejection.documentId)) errors.push(`${label} references a missing legacy membership`);
    if (accountedLegacy.has(rejection.documentId)) errors.push(`legacy membership ${rejection.documentId} is accounted more than once`);
    accountedLegacy.add(rejection.documentId);
  }

  for (const [index, rejection] of rejectedStudios.entries()) {
    const label = `rejectedStudios[${index}]`;
    if (!plainObject(rejection) || !validDocumentSegment(rejection.studioId)) { errors.push(`${label}.studioId is invalid`); continue; }
    if (!evidenceRef(rejection.authorityEvidenceRef) || typeof rejection.reason !== 'string' || rejection.reason.trim().length < 8) errors.push(`${label} requires a meaningful reason and authorityEvidenceRef`);
    if (!studios.has(rejection.studioId)) errors.push(`${label} references a missing Studio`);
    if (rejectedStudioIds.has(rejection.studioId)) errors.push(`Studio ${rejection.studioId} is rejected more than once`);
    rejectedStudioIds.add(rejection.studioId);
  }

  for (const legacyId of legacy.keys()) if (!accountedLegacy.has(legacyId)) errors.push(`legacy membership ${legacyId} is not explicitly accepted or rejected`);
  for (const canonicalPath of canonical.keys()) if (!accountedCanonicalPaths.has(canonicalPath)) errors.push(`canonical membership ${canonicalPath} is not explicitly accepted or rejected`);
  for (const studioId of studios.keys()) {
    if (!acceptedStudioIds.has(studioId) && !rejectedStudioIds.has(studioId)) errors.push(`Studio ${studioId} is not explicitly accepted or rejected`);
    if (acceptedStudioIds.has(studioId) && rejectedStudioIds.has(studioId)) errors.push(`Studio ${studioId} cannot be both accepted and rejected`);
  }
  for (const studioId of acceptedStudioIds) {
    if ((ownerCounts.get(studioId) ?? 0) !== 1) errors.push(`accepted Studio ${studioId} must have exactly one active owner`);
  }

  return {ok: errors.length === 0, errors, entries};
}

export function buildMigrationPlan({manifest, inventory, canonicalBefore, generatedAt}) {
  const validation = validateAuthorityManifest(manifest, inventory, manifest.projectId);
  if (!validation.ok) throw new Error(`invalid authority manifest:\n- ${validation.errors.join('\n- ')}`);
  const before = new Map((canonicalBefore ?? []).map((item) => [item.path, item.data ?? null]));
  const membershipOperations = manifest.entries.map((entry) => {
    const path = `studios/${entry.studioId}/members/${entry.uid}`;
    const previous = before.get(path) ?? null;
    const after = {
      uid: entry.uid,
      studioId: entry.studioId,
      role: entry.role,
      status: entry.status,
      schemaVersion: CANONICAL_MEMBERSHIP_SCHEMA,
      authoritySource: 'verified_migration',
      authorityEvidenceRef: entry.authorityEvidenceRef,
      createdBy: previous?.createdBy ?? `migration:${manifest.approvedBy}`,
      createdAt: previous?.createdAt ?? generatedAt,
      updatedBy: `migration:${manifest.approvedBy}`,
      updatedAt: generatedAt,
    };
    return {path, before: previous, beforeHash: sha256(previous), after, afterHash: sha256(after)};
  });
  const rejectedCanonicalOperations = manifest.rejectedCanonicalMemberships.map((entry) => {
    const path = `studios/${entry.studioId}/members/${entry.uid}`;
    const previous = before.get(path) ?? null;
    return {path, before: previous, beforeHash: sha256(previous), after: null, afterHash: sha256(null)};
  });
  const studioOperations = [...new Set(manifest.entries.map((entry) => entry.studioId))].map((studioId) => {
    const studio = (inventory.studios ?? []).find((item) => item.id === studioId);
    const previous = studio?.data ?? null;
    if (!previous) throw new Error(`accepted Studio ${studioId} disappeared from the migration inventory`);
    const owner = manifest.entries.find((entry) => entry.studioId === studioId && entry.role === 'owner' && entry.status === 'active');
    const after = {...previous, studioId, createdBy: previous.createdBy ?? owner.uid};
    return {path: `studios/${studioId}`, before: previous, beforeHash: sha256(previous), after, afterHash: sha256(after)};
  });
  const operations = [...studioOperations, ...membershipOperations, ...rejectedCanonicalOperations]
    .sort((a, b) => a.path.localeCompare(b.path));
  if (operations.length > MAX_ATOMIC_MEMBERSHIPS) throw new Error(`migration operations exceed the atomic limit of ${MAX_ATOMIC_MEMBERSHIPS}`);

  const base = {
    receiptSchemaVersion: MIGRATION_RECEIPT_SCHEMA,
    status: 'planned',
    projectId: manifest.projectId,
    generatedAt,
    approvedBy: manifest.approvedBy,
    approvedAt: manifest.approvedAt,
    approvalEvidenceRef: manifest.approvalEvidenceRef,
    manifestHash: sha256(manifest),
    inventoryHash: sha256(inventory),
    inventoryIdentityHash: sha256({
      studioIds: (inventory.studios ?? []).map((item) => item.id).sort(),
      legacyMembershipIds: (inventory.legacyMemberships ?? []).map((item) => item.id).sort(),
    }),
    acceptedMembershipCount: membershipOperations.length,
    acceptedStudioCount: studioOperations.length,
    rejectedCanonicalMembershipCount: rejectedCanonicalOperations.length,
    rejectedLegacyMembershipCount: manifest.rejectedLegacyMemberships.length,
    rejectedStudioCount: manifest.rejectedStudios.length,
    operations,
  };
  return {...base, planDigest: sha256(base)};
}

export function validateRollbackCanonicalInventory(receipt, canonicalMemberships, operation = 'rollback') {
  const expectedPaths = (receipt?.operations ?? [])
    .filter((operation) => /^studios\/[^/]+\/members\/[^/]+$/.test(operation.path) && operation.after !== null)
    .map((operation) => operation.path)
    .sort();
  const livePaths = (canonicalMemberships ?? [])
    .map((membership) => membership.path)
    .filter((membershipPath) => /^studios\/[^/]+\/members\/[^/]+$/.test(membershipPath))
    .sort();
  if (stableJson(livePaths) !== stableJson(expectedPaths)) {
    return {
      ok: false,
      error: `${operation} blocked because the canonical membership path set changed after migration`,
      expectedPaths,
      livePaths,
    };
  }
  return {ok: true, expectedPaths, livePaths};
}

export function validateReceipt(receipt) {
  const errors = [];
  if (!plainObject(receipt) || ![1, MIGRATION_RECEIPT_SCHEMA].includes(receipt.receiptSchemaVersion)) errors.push('unsupported receipt schema');
  if (!['planned', 'applied', 'verified', 'rolled_back'].includes(receipt?.status)) errors.push('unsupported receipt status');
  if (!Array.isArray(receipt?.operations) || receipt.operations.length === 0 || receipt.operations.length > MAX_ATOMIC_MEMBERSHIPS) errors.push('receipt operations are missing or exceed the atomic limit');
  if (receipt?.receiptSchemaVersion === MIGRATION_RECEIPT_SCHEMA && (typeof receipt.inventoryIdentityHash !== 'string' || !/^[0-9a-f]{64}$/.test(receipt.inventoryIdentityHash))) errors.push('schema-2 receipt inventoryIdentityHash is missing or invalid');
  const base = {...receipt};
  delete base.planDigest;
  delete base.appliedAt;
  delete base.verifiedAt;
  delete base.rolledBackAt;
  delete base.status;
  const plannedBase = {...base, status: 'planned'};
  if (sha256(plannedBase) !== receipt?.planDigest) errors.push('receipt planDigest does not match its immutable plan');
  for (const [index, operation] of (receipt?.operations ?? []).entries()) {
    if (sha256(operation.before ?? null) !== operation.beforeHash) errors.push(`operation ${index} beforeHash mismatch`);
    if (sha256(operation.after) !== operation.afterHash) errors.push(`operation ${index} afterHash mismatch`);
  }
  return {ok: errors.length === 0, errors};
}
