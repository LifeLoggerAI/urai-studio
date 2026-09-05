import assert from 'node:assert/strict';
import fragmentSpec from '../system/spatial-handoff.openapi.json' with { type: 'json' };
import canonicalSpec from '../system/urai-studio.openapi.json' with { type: 'json' };

const route = '/api/system/spatial-handoff';

assert.equal(fragmentSpec.openapi, '3.0.3');
assert.ok(fragmentSpec.paths[route]);
assert.ok(fragmentSpec.paths[route].get);
const wireSchema = fragmentSpec.components.schemas.spatialHandoff;
const schemas = fragmentSpec.components.schemas;
for (const field of [
  'contractVersion',
  'producer',
  'consumer',
  'runtimeTargets',
  'sceneManifest',
  'assetManifest',
  'consentReceipt',
  'safetyBoundaries',
  'releaseEvidence',
]) {
  assert.ok(wireSchema.required.includes(field), `OpenAPI wire schema must require ${field}`);
}
assert.equal(JSON.stringify(fragmentSpec).includes('"const"'), false, 'OpenAPI 3.0 schema must not use const');
assert.deepEqual(wireSchema.properties.contractVersion.enum, ['0.1.0']);
assert.deepEqual(wireSchema.properties.producer.enum, ['urai-studio']);
assert.deepEqual(wireSchema.properties.consumer.enum, ['urai-spatial']);
assert.deepEqual(wireSchema.properties.runtimeTargets.not.items.not.enum, ['web-spatial']);

assert.equal(wireSchema.properties.assetManifest.items.$ref, '#/components/schemas/spatialAsset');
assert.equal(schemas.spatialAsset.oneOf.length, 8);
assert.deepEqual(schemas.spatialMeshAsset.allOf[1].properties.mimeType.enum, ['model/gltf-binary', 'model/gltf+json']);
assert.equal(schemas.spatialAudioAsset.allOf[1].properties.mimeType.pattern, '^audio/[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]*$');
assert.equal(schemas.spatialTextureAsset.allOf[1].properties.mimeType.pattern, '^image/[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]*$');
assert.deepEqual(schemas.spatialSceneJsonAsset.allOf[1].properties.mimeType.enum, ['application/json']);

for (const field of ['receiptId', 'tenantId', 'userId', 'purpose', 'grantedCategories', 'createdAt', 'retentionPolicyId']) {
  assert.ok(schemas.spatialConsentReceipt.required.includes(field), `consent receipt must require ${field}`);
}
for (const field of ['layer', 'requiredLanguage']) {
  assert.ok(schemas.spatialSafetyBoundary.required.includes(field), `safety boundary must require ${field}`);
}
for (const field of ['studioBuildSha', 'spatialBuildSha', 'validatorName', 'validatorVersion', 'validatedAt', 'liveSmokeUrl']) {
  assert.ok(schemas.spatialReleaseEvidence.required.includes(field), `release evidence must require ${field}`);
}
assert.equal(schemas.spatialConsentReceipt.additionalProperties, false);
assert.equal(schemas.spatialSafetyBoundary.additionalProperties, false);
assert.equal(schemas.spatialReleaseEvidence.additionalProperties, false);

for (const [field, schemaName, requiredField] of [
  ['cameraRig', 'spatialCameraRig', 'mode'],
  ['lightingProfile', 'spatialNamedProfile', 'profile'],
  ['groundLayer', 'spatialAssetLayer', 'assetId'],
  ['fallbackState', 'spatialFallbackState', 'renderer'],
]) {
  assert.equal(schemas.spatialSceneManifest.properties[field].$ref, `#/components/schemas/${schemaName}`);
  assert.ok(schemas[schemaName].required.includes(requiredField));
  assert.equal(schemas[schemaName].additionalProperties, false);
}

assert.equal(canonicalSpec.openapi, '3.0.3');
assert.ok(canonicalSpec.paths[route], 'canonical Studio OpenAPI must include the Spatial handoff route');
assert.ok(canonicalSpec.paths[route].get, 'canonical Studio OpenAPI must expose the Spatial handoff GET contract');

console.log('spatial handoff openapi fragment and canonical route passed');
