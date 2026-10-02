import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.resolve('productions/private-memory-proof-001/production.json');
const text = fs.readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(text);

const fail = (message) => { throw new Error(`private_family_film_guard:${message}`); };

for (const pattern of [
  /drive\.google\.com/i,
  /docs\.google\.com/i,
  /mail\.google\.com/i,
  /gmailMessageId/i,
  /driveFileId/i,
  /driveFolderId/i,
  /exactAddress/i,
]) {
  if (pattern.test(text)) fail(`private_pointer_leaked:${pattern}`);
}

if (manifest.schemaVersion !== '2.0.0') fail('schema_version_not_current');
if (manifest.classification !== 'private-family-production') fail('classification_not_private_family_production');
if (manifest.publicReleaseAuthorized !== false) fail('public_release_must_remain_false');
if (manifest.runtimeIntegrationRequired !== true) fail('runtime_integration_not_required');

const expectedTruth = new Set([
  'RECORDED_SOURCE_TRUTH',
  'ATTRIBUTED_FAMILY_RECOLLECTION',
  'SPATIALLY_RECONSTRUCTABLE',
  'INTERPRETIVE_CINEMATIC_RECREATION',
  'UNKNOWN_UNRESOLVED',
]);
for (const truthClass of expectedTruth) {
  if (!manifest.truthClasses?.includes(truthClass)) fail(`missing_truth_class:${truthClass}`);
}

for (const deliverable of ['fullFeature','heroCut','trailer','teaser','vertical916','replayChapters','captions','provenanceManifest']) {
  if (!manifest.deliverables?.[deliverable]) fail(`missing_deliverable:${deliverable}`);
}

for (const field of [
  'memoryId','personIds','placeId','timeRange','relationshipIds','sourceIds','audioIds','imageIds','videoIds',
  'objectIds','storyNodeIds','truthClass','confidence','privacyClass','consentState','cinematicAssetId','spatialAssetId',
  'captionTrack','audioMix','languageTracks','emotionalWeather','replayEntry','replayExit','lifeMovieChapter','provenance',
]) {
  if (!manifest.runtimeContract?.includes(field)) fail(`missing_runtime_contract_field:${field}`);
}

if (!Array.isArray(manifest.existingGeneratedAssets) || manifest.existingGeneratedAssets.length < 1) {
  fail('generated_asset_ledger_missing');
}
for (const asset of manifest.existingGeneratedAssets) {
  if (!asset.taskId || !asset.role) fail('generated_asset_identity_missing');
  if (asset.acceptance !== 'pending-literal-visual-qc') fail(`generated_asset_overclaimed:${asset.taskId}`);
}

if (manifest.acceptance?.generationSuccessIsVisualAcceptance !== false) fail('generation_must_not_equal_visual_acceptance');
if (manifest.acceptance?.goldMasterRequiresRenderedVerifiedArtifact !== true) fail('gold_master_render_verification_missing');
if (manifest.acceptance?.publicReleaseRemainsSeparate !== true) fail('public_release_boundary_missing');

for (const forbiddenBeat of ['family-watch-object','archival-object','105']) {
  if (text.includes(forbiddenBeat)) fail(`stale_rejected_proof_beat:${forbiddenBeat}`);
}

console.log('Private family Life Film guard: PASS');
