import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/studio-spatial-handoff.ts', import.meta.url), 'utf8');
const fixture = JSON.parse(
  fs.readFileSync(new URL('./fixtures/studio-spatial-export-0.1.0.json', import.meta.url), 'utf8'),
);
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const contract = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`);

function copy(value) {
  return structuredClone(value);
}

const trustedAuthority = {
  source: 'protected-deployment-and-spatial-acceptance',
  studioBuildSha: fixture.releaseEvidence.studioBuildSha,
  spatialBuildSha: fixture.releaseEvidence.spatialBuildSha,
  liveSmokeUrl: fixture.releaseEvidence.liveSmokeUrl,
  studioDeploymentReceiptId: 'studio-deploy-001',
  spatialAcceptanceReceiptId: 'spatial-acceptance-001',
  receiptDigest: `sha256:${'d'.repeat(64)}`,
  verifiedAt: '2026-09-03T00:01:00.000Z',
  validatorName: fixture.releaseEvidence.validatorName,
  validatorVersion: fixture.releaseEvidence.validatorVersion,
  validatedAt: fixture.releaseEvidence.validatedAt,
  consentAuthority: {
    source: 'protected-consent-registry',
    status: 'active',
    receiptId: fixture.consentReceipt.receiptId,
    tenantId: fixture.consentReceipt.tenantId,
    userId: fixture.consentReceipt.userId,
    purpose: fixture.consentReceipt.purpose,
    grantedCategories: fixture.consentReceipt.grantedCategories,
    createdAt: fixture.consentReceipt.createdAt,
    retentionPolicyId: fixture.consentReceipt.retentionPolicyId,
    verifiedAt: '2026-09-03T00:01:00.000Z',
    receiptDigest: `sha256:${'e'.repeat(64)}`,
  },
  assetAuthority: {
    source: 'protected-tenant-asset-registry',
    tenantId: fixture.tenantId,
    verifiedAt: '2026-09-03T00:01:00.000Z',
    receiptDigest: `sha256:${'f'.repeat(64)}`,
    assetRecords: fixture.assetManifest.map(({assetId, kind, uri, fallbackUri, mimeType, checksum, scope}) => ({
      assetId, kind, uri, fallbackUri, mimeType, checksum, scope,
    })),
  },
  safetyAuthority: {
    source: 'protected-safety-policy-registry',
    policyId: 'studio-spatial-safety-v1',
    verifiedAt: '2026-09-03T00:01:00.000Z',
    receiptDigest: `sha256:${'a'.repeat(64)}`,
    boundaries: fixture.safetyBoundaries,
  },
};

test('emits the current Spatial 0.1.0 wire shape only when complete', () => {
  const validation = contract.validateStudioSpatialExport(fixture);
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.deepEqual(validation.rejectedRuntimeTargets, []);

  const untrustedEmission = contract.emitStudioSpatialExport(fixture);
  assert.equal(untrustedEmission.ok, false);
  assert.ok(untrustedEmission.validation.errors.includes('trusted release authority is required before emission'));
  assert.equal(contract.isStudioSpatialManifestReleaseSafe(fixture), false);

  const emission = contract.emitStudioSpatialExport(fixture, trustedAuthority);
  assert.equal(emission.ok, true);
  assert.deepEqual(emission.export, fixture);
  assert.equal(emission.export.contractVersion, '0.1.0');
  assert.equal(emission.export.producer, 'urai-studio');
  assert.equal(emission.export.consumer, 'urai-spatial');
  assert.equal(contract.isStudioSpatialManifestReleaseSafe(fixture, trustedAuthority), true);
});

test('supports GLB and glTF as mesh assets with their standard MIME types', () => {
  assert.equal(contract.spatialModelKind('glb'), 'mesh');
  assert.equal(contract.spatialModelMimeType('glb'), 'model/gltf-binary');
  assert.equal(contract.spatialModelKind('gltf'), 'mesh');
  assert.equal(contract.spatialModelMimeType('gltf'), 'model/gltf+json');

  const gltf = copy(fixture);
  gltf.assetManifest[0].uri = 'https://urai.app/assets/home-chamber.gltf';
  gltf.assetManifest[0].mimeType = 'model/gltf+json';
  assert.equal(contract.validateStudioSpatialExport(gltf).ok, true);
});

test('fails closed on incomplete asset, scene, consent, safety, or release evidence', () => {
  const cases = [
    ['assetManifest', (value) => { value.assetManifest = []; }],
    ['checksum', (value) => { value.assetManifest[0].checksum = 'sha256:not-a-digest'; }],
    ['scope', (value) => { value.assetManifest[0].scope = ''; }],
    ['sceneManifest', (value) => { delete value.sceneManifest.cameraRig; }],
    ['consentReceipt', (value) => { value.consentReceipt.grantedCategories = []; }],
    ['safetyBoundaries', (value) => { value.safetyBoundaries = []; }],
    ['releaseEvidence', (value) => { delete value.releaseEvidence; }],
    ['release SHA', (value) => { value.releaseEvidence.spatialBuildSha = 'unknown'; }],
    ['live smoke URL', (value) => { value.releaseEvidence.liveSmokeUrl = 'http://urai.app/status'; }],
  ];

  for (const [label, mutate] of cases) {
    const value = copy(fixture);
    mutate(value);
    const validation = contract.validateStudioSpatialExport(value);
    assert.equal(validation.ok, false, `${label} unexpectedly passed`);
    assert.equal(contract.emitStudioSpatialExport(value).export, null);
  }
});

test('rejects unsafe URIs, unsupported runtime claims, and mismatched GLB kind', () => {
  const unsafeUri = copy(fixture);
  unsafeUri.assetManifest[0].uri = 'javascript:alert(1)';
  assert.equal(contract.validateStudioSpatialExport(unsafeUri).ok, false);

  const unsupportedRuntime = copy(fixture);
  unsupportedRuntime.runtimeTargets = ['web-spatial', 'webxr'];
  const runtimeValidation = contract.validateStudioSpatialExport(unsupportedRuntime);
  assert.equal(runtimeValidation.ok, false);
  assert.ok(runtimeValidation.rejectedRuntimeTargets.includes('webxr'));

  for (const [kind, mimeType] of [
    ['texture', 'audio/mpeg'],
    ['audio', 'image/png'],
    ['subtitle', 'application/json'],
    ['scene-json', 'text/plain'],
    ['shader', 'image/png'],
    ['sprite', 'audio/mpeg'],
    ['particle-config', 'text/plain'],
  ]) {
    const wrongKind = copy(fixture);
    wrongKind.assetManifest[0].kind = kind;
    wrongKind.assetManifest[0].mimeType = mimeType;
    const kindValidation = contract.validateStudioSpatialExport(wrongKind);
    assert.equal(kindValidation.ok, false, `${kind}/${mimeType} unexpectedly passed`);
    assert.ok(kindValidation.errors.some((error) => error.includes(`${kind} must use a compatible MIME type`)));
  }
});

test('rejects malformed MIME types, non-RFC3339 timestamps, and undeclared properties', () => {
  for (const mimeType of ['image/', 'audio/', 'image/png; charset=utf-8']) {
    const malformed = copy(fixture);
    malformed.assetManifest[0].kind = mimeType.startsWith('audio') ? 'audio' : 'texture';
    malformed.assetManifest[0].mimeType = mimeType;
    assert.equal(contract.validateStudioSpatialExport(malformed).ok, false, `${mimeType} unexpectedly passed`);
  }
  for (const timestamp of ['0', '2026-09-03', '09/03/2026 12:00', '2026-02-31T00:00:00Z']) {
    const malformed = copy(fixture);
    malformed.createdAt = timestamp;
    assert.equal(contract.validateStudioSpatialExport(malformed).ok, false, `${timestamp} unexpectedly passed`);
  }
  for (const mutate of [
    (value) => { value.extra = true; },
    (value) => { value.consentReceipt.extra = true; },
    (value) => { value.sceneManifest.cameraRig.extra = true; },
  ]) {
    const malformed = copy(fixture);
    mutate(malformed);
    assert.equal(contract.validateStudioSpatialExport(malformed).ok, false);
  }
});

test('binds consent and asset ownership to protected authority evidence', () => {
  const inventedConsent = copy(fixture);
  inventedConsent.consentReceipt.receiptId = 'invented-consent';
  assert.equal(contract.emitStudioSpatialExport(inventedConsent, trustedAuthority).ok, false);

  const crossTenantAsset = copy(fixture);
  crossTenantAsset.assetManifest[0].uri = 'gs://urai-assets/another-tenant/home-chamber.glb';
  assert.equal(contract.emitStudioSpatialExport(crossTenantAsset, trustedAuthority).ok, false);

  const revokedConsent = copy(trustedAuthority);
  revokedConsent.consentAuthority.status = 'revoked';
  assert.equal(contract.emitStudioSpatialExport(fixture, revokedConsent).ok, false);

  const inventedConsentTime = copy(fixture);
  inventedConsentTime.consentReceipt.createdAt = '2026-09-03T00:00:01.000Z';
  assert.equal(contract.emitStudioSpatialExport(inventedConsentTime, trustedAuthority).ok, false);

  const malformedAssetAuthority = copy(trustedAuthority);
  malformedAssetAuthority.assetAuthority.assetRecords.push(null);
  assert.equal(contract.emitStudioSpatialExport(fixture, malformedAssetAuthority).ok, false);

  for (const mutate of [
    (value) => { value.assetManifest[0].fallbackUri = 'gs://urai-assets/another-tenant/fallback.glb'; },
    (value) => { value.assetManifest[0].kind = 'scene-json'; value.assetManifest[0].mimeType = 'application/json'; },
    (value) => { value.assetManifest[0].mimeType = 'model/gltf+json'; },
  ]) {
    const alteredLoaderMetadata = copy(fixture);
    mutate(alteredLoaderMetadata);
    assert.equal(contract.emitStudioSpatialExport(alteredLoaderMetadata, trustedAuthority).ok, false);
  }
});

test('binds the complete safety boundary set to protected policy evidence', () => {
  const weakened = copy(fixture);
  weakened.safetyBoundaries[0].requiredLanguage = 'none';
  weakened.safetyBoundaries[0].humanReviewRequired = false;
  assert.equal(contract.emitStudioSpatialExport(weakened, trustedAuthority).ok, false);

  const incompleteAuthority = copy(trustedAuthority);
  incompleteAuthority.safetyAuthority.boundaries = [];
  assert.equal(contract.emitStudioSpatialExport(fixture, incompleteAuthority).ok, false);

  const malformedAuthority = copy(trustedAuthority);
  malformedAuthority.safetyAuthority.receiptDigest = 'sha256:not-a-digest';
  assert.equal(contract.emitStudioSpatialExport(fixture, malformedAuthority).ok, false);
});

test('rejects self-attested or mismatched release authority', () => {
  const mismatched = {...trustedAuthority, spatialBuildSha: 'e'.repeat(40)};
  const emission = contract.emitStudioSpatialExport(fixture, mismatched);
  assert.equal(emission.ok, false);
  assert.equal(emission.export, null);
  assert.ok(emission.validation.errors.some((error) => error.includes('Spatial acceptance SHA')));

  const malformed = {...trustedAuthority, receiptDigest: 'sha256:not-a-digest'};
  assert.equal(contract.isStudioSpatialManifestReleaseSafe(fixture, malformed), false);

  const inventedValidator = {...trustedAuthority, validatorName: 'invented-validator'};
  assert.equal(contract.isStudioSpatialManifestReleaseSafe(fixture, inventedValidator), false);
});

test('blocked descriptors are not wire exports and never claim live integration', () => {
  const blocked = contract.createBlockedStudioSpatialHandoff({
    exportId: fixture.exportId,
    projectId: fixture.projectId,
    tenantId: fixture.tenantId,
    userId: fixture.consentReceipt.userId,
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, 'blocked');
  assert.equal(blocked.liveIntegrationClaimed, false);
  assert.equal(contract.validateStudioSpatialExport(blocked).ok, false);
});

for (const legacyField of ['producerSystem:', 'consumerSystem:', 'targetRuntimes:', 'assets:', 'scene:']) {
  assert.ok(!source.includes(legacyField), `legacy wire field remains in contract: ${legacyField}`);
}
