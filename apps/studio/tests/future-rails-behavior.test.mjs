import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

function transpile(path, replacements = []) {
  let source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  for (const [from, to] of replacements) source = source.replace(from, to);
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}

function dataUrl(code) {
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}

const featureCode = transpile('../lib/studio/feature-policy.ts');
const featureUrl = dataUrl(featureCode);
const feature = await import(featureUrl);

const providerCode = transpile('../lib/studio/provider-adapter.ts', [
  ["'./feature-policy'", JSON.stringify(featureUrl)],
]);
const provider = await import(dataUrl(providerCode));

const evidenceCode = transpile('../lib/studio/evidence.ts');
const evidenceUrl = dataUrl(evidenceCode);
const evidence = await import(evidenceUrl);
const exportPackage = await import(dataUrl(transpile('../lib/studio/export-package.ts', [
  ["'./evidence'", JSON.stringify(evidenceUrl)],
])));
const assetFactory = await import(dataUrl(transpile('../lib/studio/asset-factory-orchestration.ts')));

const hardOffPolicy = feature.resolveStudioFeaturePolicy('provider-execution', {
  URAI_STUDIO_FEATURE_PROVIDER_EXECUTION: 'live',
});
assert.equal(hardOffPolicy.hardOff, true);
assert.equal(hardOffPolicy.state, 'disabled');
assert.equal(hardOffPolicy.activationAuthorized, false);
assert.equal(feature.canExecuteStudioFeature('provider-execution', {
  URAI_STUDIO_FEATURE_PROVIDER_EXECUTION: 'live',
}), false);

const configuredLive = feature.resolveStudioFeaturePolicy('uploads', {
  URAI_STUDIO_FEATURE_UPLOADS: 'live',
});
assert.equal(configuredLive.state, 'live');
assert.equal(configuredLive.activationAuthorized, false, 'server configuration alone must not authorize activation');
assert.equal(feature.canExecuteStudioFeature('uploads', { URAI_STUDIO_FEATURE_UPLOADS: 'live' }), false);
const protectedAuthority = {
  source: 'protected-admin-governance',
  featureId: 'uploads',
  requestedState: 'live',
  actorUid: 'admin-1',
  actorRole: 'admin',
  authorityRef: 'governance:receipt-1',
  issuedAt: '2026-09-23T00:00:00.000Z',
  expiresAt: '2026-09-25T00:00:00.000Z',
  receiptDigest: `sha256:${'a'.repeat(64)}`,
};
assert.equal(feature.canExecuteStudioFeature(
  'uploads',
  { URAI_STUDIO_FEATURE_UPLOADS: 'live' },
  protectedAuthority,
  new Date('2026-09-24T00:00:00.000Z'),
), true);
assert.equal(feature.canExecuteStudioFeature(
  'uploads',
  { URAI_STUDIO_FEATURE_UPLOADS: 'live' },
  { ...protectedAuthority, actorRole: 'editor' },
  new Date('2026-09-24T00:00:00.000Z'),
), false);
assert.equal(feature.canExecuteStudioFeature(
  'uploads',
  { URAI_STUDIO_FEATURE_UPLOADS: 'live' },
  { ...protectedAuthority, expiresAt: '2026-09-23T12:00:00.000Z' },
  new Date('2026-09-24T00:00:00.000Z'),
), false);

const transition = feature.createFeatureTransitionReceipt({
  current: hardOffPolicy,
  next: 'live',
  actorRef: 'admin:user-1',
  authorityRef: 'review:required',
  requestedAt: '2026-09-23T00:00:00.000Z',
});
assert.equal(transition.allowed, false);
assert.equal(transition.reason, 'hard_off_requires_separate_authority');
assert.match(transition.receiptHash, /^[a-f0-9]{64}$/);

function request(overrides = {}) {
  return {
    requestId: 'req-1',
    idempotencyKey: 'idem-1',
    tenantId: 'studio-alpha',
    userId: 'user-a',
    providerId: 'fake-provider',
    toolOrModel: 'fake-model',
    mediaType: 'image',
    maxAttempts: 2,
    timeoutMs: 1000,
    estimatedSpendCents: 0,
    spendCeilingCents: 0,
    sourceRefs: ['source:fixture'],
    dataPolicy: {
      retention: 'none',
      trainingUse: 'prohibited',
      privateMemoryAllowed: false,
      likenessAllowed: false,
      minorsAllowed: false,
    },
    executionControl: {
      paused: false,
      killSwitchActive: false,
      cancelRequested: false,
    },
    ...overrides,
  };
}

let fakeCalls = 0;
const fakeAdapter = {
  id: 'fake-provider',
  async execute() {
    fakeCalls += 1;
    return {
      providerJobId: 'provider-job-1',
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: 'image/png',
      sourceRefs: ['source:fixture'],
    };
  },
};

const blocked = await provider.executeStudioProvider(
  request(),
  fakeAdapter,
  { URAI_STUDIO_FEATURE_PROVIDER_EXECUTION: 'live' },
);
assert.equal(blocked.ok, false);
assert.equal(blocked.providerCalled, false);
assert.equal(blocked.spendAuthorized, false);
assert.equal(blocked.errorCode, 'provider_execution_hard_off');
assert.equal(fakeCalls, 0, 'hard-off provider execution must be zero-network');

const paused = await provider.executeStudioProvider(
  request({ executionControl: { paused: true, killSwitchActive: false, cancelRequested: false } }),
  fakeAdapter,
  {},
);
assert.equal(paused.errorCode, 'provider_execution_paused');
assert.equal(fakeCalls, 0);

const killed = await provider.executeStudioProvider(
  request({ executionControl: { paused: false, killSwitchActive: true, cancelRequested: false } }),
  fakeAdapter,
  {},
);
assert.equal(killed.errorCode, 'provider_kill_switch_active');
assert.equal(fakeCalls, 0);

const canceled = await provider.executeStudioProvider(
  request({ executionControl: { paused: false, killSwitchActive: false, cancelRequested: true } }),
  fakeAdapter,
  {},
);
assert.equal(canceled.status, 'canceled');
assert.equal(canceled.cancelRequested, true);
assert.equal(fakeCalls, 0);

assert.throws(
  () => provider.validateProviderRequest(request({ estimatedSpendCents: 2, spendCeilingCents: 1 })),
  /provider_budget_rejected/,
);
assert.throws(
  () => provider.validateProviderRequest(request({
    dataPolicy: {
      retention: 'unknown',
      trainingUse: 'prohibited',
      privateMemoryAllowed: false,
      likenessAllowed: false,
      minorsAllowed: false,
    },
  })),
  /provider_data_policy_unresolved/,
);

assert.deepEqual(
  provider.decideProviderAttempt({ request: request(), completedAttempts: 0, retryableFailure: true }),
  { status: 'retry', nextAttempt: 1, deadLettered: false, reason: 'provider_retry_authorized_by_contract' },
);
assert.equal(
  provider.decideProviderAttempt({ request: request(), completedAttempts: 2, retryableFailure: true }).status,
  'dead-letter',
);
assert.equal(
  provider.decideProviderAttempt({ request: request(), completedAttempts: 1, retryableFailure: false }).reason,
  'provider_non_retryable_failure',
);
const dead = provider.createDeadLetterReceipt(request(), 2, 'provider_failed');
assert.equal(dead.deadLettered, true);
assert.equal(dead.status, 'dead-lettered');
assert.equal(dead.spendAuthorized, false);

const bytes = new TextEncoder().encode('version-a');
const hash = evidence.contentHash(bytes);
assert.match(hash, /^[a-f0-9]{64}$/);

assert.throws(
  () => evidence.createApprovalReceipt({
    tenantId: 'studio-alpha',
    versionId: 'v1',
    contentHash: hash,
    reviewerUid: 'viewer-a',
    reviewerRole: 'viewer',
    createdAt: '2026-09-23T00:00:00.000Z',
  }),
  /studio_review_role_cannot_approve/,
);

const approval = evidence.createApprovalReceipt({
  tenantId: 'studio-alpha',
  versionId: 'v1',
  contentHash: hash,
  reviewerUid: 'reviewer-a',
  reviewerRole: 'reviewer',
  createdAt: '2026-09-23T00:00:00.000Z',
});
const version = {
  id: 'v1',
  schemaVersion: 3,
  tenantId: 'studio-alpha',
  projectId: 'project-a',
  subjectId: 'asset-a',
  contentHash: hash,
  sourceRefs: ['source:fixture'],
  derivativeOf: [],
  createdBy: 'editor-a',
  createdAt: '2026-09-23T00:00:00.000Z',
};
assert.equal(evidence.approvalMatchesVersion(approval, version), true);
assert.equal(evidence.approvalMatchesVersion(approval, { ...version, contentHash: '0'.repeat(64) }), false);

const unknownRights = {
  ownership: 'unknown',
  license: 'not-applicable',
  thirdPartyCopyright: 'not-applicable',
  trademarkArchive: 'not-applicable',
  humanLikeness: 'not-applicable',
  voiceLikeness: 'not-applicable',
  familyAdvisorLikeness: 'not-applicable',
  minors: 'not-applicable',
  providerTrainingPermission: 'not-applicable',
  providerRetention: 'not-applicable',
  derivativeRights: 'granted',
  publicationAuthority: 'granted',
  privateMemoryUse: 'not-applicable',
};
assert.equal(evidence.rightsReadyForRelease(unknownRights), false);
assert.equal(evidence.rightsReadyForRelease({ ...unknownRights, ownership: 'granted' }), true);

const incompleteA11y = {
  captions: 'required',
  srt: 'required',
  transcript: 'required',
  audioDescription: 'not-required',
  textlessMaster: 'present',
  soundOff: 'present',
  reducedMotion: 'present',
  sensorySafe: 'not-required',
  haptics: 'not-required',
  altDescription: 'present',
  sourceLanguage: 'en',
  locale: 'en-US',
  reviewState: 'approved',
};
assert.equal(evidence.accessibilityReadyForRelease(incompleteA11y), false);
assert.equal(evidence.accessibilityReadyForRelease({
  ...incompleteA11y,
  captions: 'present',
  srt: 'present',
  transcript: 'present',
}), true);

assert.throws(
  () => exportPackage.validateExportArtifacts([{ id: 'a', contentHash: 'bad', mimeType: 'image/png', sizeBytes: 1, storagePath: 'x' }]),
  /invalid_export_content_hash/,
);
assert.throws(
  () => exportPackage.validateExportArtifacts([{ id: 'a', contentHash: '0'.repeat(64), mimeType: 'invalid', sizeBytes: 1, storagePath: 'x' }]),
  /invalid_export_mime_type/,
);

const pkg = exportPackage.createHardOffExportPackage({
  tenantId: 'studio-alpha',
  projectId: 'project-a',
  exportId: 'export-a',
  versionId: 'v1',
  artifacts: [{ id: 'a', contentHash: '0'.repeat(64), mimeType: 'image/png', sizeBytes: 1, storagePath: 'exports/a.png' }],
  provenance: [],
  rights: { ...unknownRights, ownership: 'granted' },
  accessibility: { ...incompleteA11y, captions: 'present', srt: 'present', transcript: 'present' },
  localizationAuthorityRef: 'authority:localization-current',
  localization: [{ locale: 'en-US', sourceLanguage: 'en', reviewState: 'approved' }],
  approvals: [approval],
  retention: { policyId: 'retention-v1' },
  auditRefs: ['audit:1'],
});
assert.equal(pkg.publicReleaseAuthorized, false);
assert.equal(pkg.delivery.enabled, false);
assert.equal(exportPackage.exportPackageCanDeliver(pkg), false);

const assetFactoryRequest = assetFactory.createStudioAssetFactoryRequest({
  studioTenantId: 'studio-alpha',
  studioProjectId: 'project-a',
  studioVersionId: 'v1',
  studioContentHash: hash,
  requestId: 'req-af-1',
  idempotencyKey: 'idem-af-1',
  assetSpec: {
    assetType: 'graphic',
    format: 'png',
    promptRef: 'private-authority:prompt-1',
    tags: ['urai', 'studio'],
    dimensions: { width: 1024, height: 1024 },
  },
});
const assetEnvelope = assetFactory.toAssetFactoryCreateAssetEnvelope(assetFactoryRequest);
assert.equal(assetEnvelope.path, '/api/assets');
assert.equal(assetEnvelope.tenantIdentitySource, 'verified-auth-claim');
assert.equal(assetEnvelope.providerExecutionAuthorized, false);
assert.equal(assetEnvelope.promotionAuthorized, false);
assert.equal('tenantId' in assetEnvelope.body, false);
assert.equal('userId' in assetEnvelope.body, false);
assert.equal('anonymousSessionId' in assetEnvelope.body, false);
assert.equal(assetFactory.assertAssetFactoryEnvelopeDoesNotSelfAssertTenant(assetEnvelope), assetEnvelope);


// Idempotency is adjudicated before any provider call.
const firstIdempotency = provider.decideProviderIdempotency(request());
assert.equal(firstIdempotency.action, 'execute');
assert.match(firstIdempotency.requestHash, /^[a-f0-9]{64}$/);
const existingIdempotency = {
  tenantId: 'studio-alpha',
  idempotencyKey: 'idem-1',
  requestHash: firstIdempotency.requestHash,
  requestId: 'req-previous',
  status: 'completed',
};
assert.equal(provider.decideProviderIdempotency(request({ requestId: 'req-retry' }), existingIdempotency).action, 'reuse');
assert.equal(
  provider.decideProviderIdempotency(request({ toolOrModel: 'different-model' }), existingIdempotency).reason,
  'idempotency_key_reused_for_different_request',
);
assert.equal(provider.providerAdapterConfigurationState(request()), 'not-configured');
assert.equal(provider.providerAdapterConfigurationState(request(), { ...fakeAdapter, id: 'other-provider' }), 'mismatch');
assert.equal(provider.providerAdapterConfigurationState(request(), fakeAdapter), 'configured');
assert.throws(() => provider.validateProviderRequest(request({ mediaType: 'unsupported' })), /provider_unsupported_media/);

const candidateBytes = new Uint8Array([10, 20, 30]);
const candidateHash = evidence.contentHash(candidateBytes);
const candidate = {
  providerJobId: 'provider-job-2',
  bytes: candidateBytes,
  mimeType: 'image/png',
  sourceRefs: ['source:fixture'],
};
const candidateValidation = provider.validateProviderArtifactCandidate(request(), candidate, {
  allowedMimeTypes: ['image/png'],
  maxSizeBytes: 10,
  expectedContentHash: candidateHash,
});
assert.equal(candidateValidation.contentHash, candidateHash);
assert.equal(candidateValidation.sizeBytes, 3);
assert.throws(() => provider.validateProviderArtifactCandidate(request(), { ...candidate, mimeType: 'text/plain' }, { allowedMimeTypes: ['image/png'], maxSizeBytes: 10 }), /provider_artifact_mime_mismatch/);
assert.throws(() => provider.validateProviderArtifactCandidate(request(), candidate, { allowedMimeTypes: ['image/png'], maxSizeBytes: 2 }), /provider_artifact_too_large/);
assert.throws(() => provider.validateProviderArtifactCandidate(request(), candidate, { allowedMimeTypes: ['image/png'], maxSizeBytes: 10, expectedContentHash: '0'.repeat(64) }), /provider_artifact_hash_mismatch/);
assert.throws(() => provider.validateProviderArtifactCandidate(request(), { ...candidate, sourceRefs: [] }, { allowedMimeTypes: ['image/png'], maxSizeBytes: 10 }), /provider_artifact_source_mismatch/);
assert.equal(provider.decideProviderFailure({ request: request(), completedAttempts: 0, kind: 'timeout' }).status, 'retry');
assert.equal(provider.decideProviderFailure({ request: request(), completedAttempts: 0, kind: 'artifact-mismatch' }).status, 'dead-letter');

const versionB = { ...version, id: 'v2', contentHash: evidence.contentHash(new TextEncoder().encode('version-b')) };
const comparison = evidence.createVersionComparisonMetadata(version, versionB, ['visual', 'audio', 'rights'], '2026-09-23T00:02:00.000Z');
assert.equal(comparison.baseVersionId, 'v1');
assert.equal(comparison.candidateVersionId, 'v2');
const queueEntry = evidence.createReviewQueueEntry({
  tenantId: versionB.tenantId,
  projectId: versionB.projectId,
  versionId: versionB.id,
  contentHash: versionB.contentHash,
  requestedByUid: 'editor-a',
  assignedReviewerUid: 'reviewer-a',
  requestedAt: '2026-09-23T00:03:00.000Z',
});
assert.equal(queueEntry.state, 'queued');
assert.equal(evidence.canEditStudioVersion('editor'), true);
assert.equal(evidence.canEditStudioVersion('viewer'), false);
const approvalB = evidence.createApprovalReceipt({
  tenantId: versionB.tenantId,
  versionId: versionB.id,
  contentHash: versionB.contentHash,
  reviewerUid: 'reviewer-a',
  reviewerRole: 'reviewer',
  createdAt: '2026-09-23T00:04:00.000Z',
});
const lifecycle = evidence.createVersionLifecycleReceipt({
  action: 'final-accept',
  version: versionB,
  actorUid: 'reviewer-a',
  actorRole: 'reviewer',
  approval: approvalB,
  createdAt: '2026-09-23T00:05:00.000Z',
});
assert.match(lifecycle.immutableReceiptHash, /^[a-f0-9]{64}$/);
assert.throws(() => evidence.createVersionLifecycleReceipt({
  action: 'final-accept', version: versionB, actorUid: 'reviewer-a', actorRole: 'reviewer', approval, createdAt: '2026-09-23T00:05:00.000Z',
}), /studio_lifecycle_exact_approval_required/);
const approvedReviewB = {
  id: 'review-v2', schemaVersion: 3, tenantId: versionB.tenantId, versionId: versionB.id, contentHash: versionB.contentHash,
  state: 'approved', reviewerUid: 'reviewer-a', reviewerRole: 'reviewer', createdAt: '2026-09-23T00:04:00.000Z',
};
const completeRights = { ...unknownRights, ownership: 'granted' };
const completeA11y = { ...incompleteA11y, captions: 'present', srt: 'present', transcript: 'present' };
assert.equal(evidence.evaluateVersionAcceptance({ version: versionB, review: approvedReviewB, approval: approvalB, rights: completeRights, accessibility: completeA11y }).accepted, true);
assert.equal(evidence.evaluateVersionAcceptance({ version: versionB, review: approvedReviewB, approval: approvalB, rights: completeRights, accessibility: completeA11y, supersededBy: 'v3' }).accepted, false);

const preflightBase = {
  ...pkg,
  releaseState: 'approved-private',
  localization: [{
    locale: 'en-US', sourceLanguage: 'en', reviewState: 'approved', accessibilityQaState: 'approved',
    rtlQaState: 'not-required', textExpansionQaState: 'passed',
  }],
  approvals: [approval],
  delivery: { enabled: false, expiresAt: '2026-10-01T00:00:00.000Z' },
};
const preflight = exportPackage.evaluateExportPackagePreflight(preflightBase, {
  requesterTenantId: 'studio-alpha',
  versionContentHash: hash,
  now: '2026-09-23T00:00:00.000Z',
});
assert.equal(preflight.sourceReady, true);
assert.equal(preflight.deliverable, false);
assert.deepEqual(preflight.activationBlockers, ['public_release_not_authorized', 'external_delivery_hard_off']);
const exportCases = [
  ['tenant_not_authorized', { ...preflightBase }, { requesterTenantId: 'other-tenant', versionContentHash: hash, now: '2026-09-23T00:00:00.000Z' }],
  ['export_revoked', { ...preflightBase, releaseState: 'revoked' }, { requesterTenantId: 'studio-alpha', versionContentHash: hash, now: '2026-09-23T00:00:00.000Z' }],
  ['delivery_expired', { ...preflightBase }, { requesterTenantId: 'studio-alpha', versionContentHash: hash, now: '2026-10-02T00:00:00.000Z' }],
  ['rights_incomplete', { ...preflightBase, rights: unknownRights }, { requesterTenantId: 'studio-alpha', versionContentHash: hash, now: '2026-09-23T00:00:00.000Z' }],
  ['accessibility_incomplete', { ...preflightBase, accessibility: incompleteA11y }, { requesterTenantId: 'studio-alpha', versionContentHash: hash, now: '2026-09-23T00:00:00.000Z' }],
  ['exact_version_approval_required', { ...preflightBase, approvals: [] }, { requesterTenantId: 'studio-alpha', versionContentHash: hash, now: '2026-09-23T00:00:00.000Z' }],
  ['invalid_export_content_hash', { ...preflightBase, artifacts: [{ ...preflightBase.artifacts[0], contentHash: 'bad' }] }, { requesterTenantId: 'studio-alpha', versionContentHash: hash, now: '2026-09-23T00:00:00.000Z' }],
  ['invalid_export_mime_type', { ...preflightBase, artifacts: [{ ...preflightBase.artifacts[0], mimeType: 'bad' }] }, { requesterTenantId: 'studio-alpha', versionContentHash: hash, now: '2026-09-23T00:00:00.000Z' }],
  ['deletion_requested', { ...preflightBase, retention: { policyId: 'retention-v1', deletionRequestedAt: '2026-09-23T00:00:00.000Z' } }, { requesterTenantId: 'studio-alpha', versionContentHash: hash, now: '2026-09-23T00:00:00.000Z' }],
];
for (const [expectedBlocker, value, context] of exportCases) {
  const result = exportPackage.evaluateExportPackagePreflight(value, context);
  assert.equal(result.sourceReady, false, `${expectedBlocker} unexpectedly passed`);
  assert.ok(result.blockers.includes(expectedBlocker), `${expectedBlocker} not reported: ${result.blockers.join(', ')}`);
}

console.log('Studio future rails behavioral guard passed');
