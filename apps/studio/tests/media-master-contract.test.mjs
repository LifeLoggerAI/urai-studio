import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const masterPath = path.join(repoRoot, 'productions/media-master/urai-v1-v5-media-master.production.json');
const jobsPath = path.join(repoRoot, 'productions/media-master/90-day-media-jobs.json');

const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
const media = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));

assert.equal(master.projectId, 'urai-v1-v5-media-master');
assert.equal(master.authority.githubIssue, 'LifeLoggerAI/urai-studio#70');
assert.equal(master.truthBoundary.trackedSemanticDeliverables, 213);
assert.equal(master.truthBoundary.firstAssetId, 'URA-001');
assert.equal(master.truthBoundary.lastAssetId, 'URA-213');
assert.equal(master.truthBoundary.blanketRegenerationAuthorized, false);
assert.equal(master.truthBoundary.filePresenceEqualsAcceptance, false);
assert.equal(master.truthBoundary.sourceCiEqualsProductionReadiness, false);

for (const state of 'ABCDEFGHIJKLMNOP') {
  assert.ok(master.stateClasses[state], `missing state class ${state}`);
}

const requiredWorlds = ['home', 'orb', 'ground', 'life-map', 'focus', 'replay', 'council', 'mirror', 'shadow', 'legacy', 'passport', 'ar', 'vr', 'xr'];
const worldIds = new Set(master.captureLibrary.worlds.map((world) => world.id));
for (const world of requiredWorlds) assert.ok(worldIds.has(world), `missing capture authority ${world}`);
assert.equal(master.captureLibrary.exactProductCaptureShaRequired, true);
assert.equal(master.captureLibrary.founderVisualApprovalRequired, true);
assert.equal(master.captureLibrary.genuineFootageAutomaticallyAccepted, false);

const requiredProductions = ['before-the-rest-of-the-world', 'finite-time', 'before-you-advise-me', 'kickstarter-hero-film', 'storytime-legacy-films'];
const productionIds = new Set(master.productions.map((production) => production.id));
for (const production of requiredProductions) assert.ok(productionIds.has(production), `missing production ${production}`);
for (const production of master.productions) assert.equal(production.publicReleaseAuthorized, false, `${production.id} must be fail-closed`);

assert.equal(master.paidGenerationPolicy.authorized, false);
assert.equal(master.paidGenerationPolicy.requiresSeparateBoundedManifest, true);
assert.equal(master.paidGenerationPolicy.unboundedRetriesAllowed, false);
assert.equal(master.paidGenerationPolicy.unboundedSpendAllowed, false);

assert.equal(media.source.driveSpreadsheetId, master.authority.driveMediaCalendarId);
assert.equal(media.source.sourceRowCount, 90);
assert.equal(media.jobs.length, 90);
assert.deepEqual(media.jobs.map((job) => job.day), Array.from({ length: 90 }, (_, index) => index + 1));
assert.equal(new Set(media.jobs.map((job) => job.id)).size, 90);
assert.deepEqual(media.jobs.map((job) => job.sourceRow), Array.from({ length: 90 }, (_, index) => index + 2));

for (const field of ['Season', 'Week', 'Tags', 'Drop', 'Core Hook', 'Primary Media', 'Languages', 'Claim Gate', 'Status', 'Owner']) {
  assert.ok(media.source.fieldAuthority.includes(field), `missing Drive field authority ${field}`);
}
for (const job of media.jobs) {
  assert.equal(job.detailSource, 'drive-calendar-row');
  assert.equal(job.approvalStatus, 'PLANNED');
  assert.equal(job.publicReleaseAuthorized, false);
  assert.equal(job.paidGenerationAuthorized, false);
}

assert.deepEqual(media.jobDefaults.aspectRatios, ['16:9', '9:16', '1:1']);
assert.equal(media.jobDefaults.captionsRequired, true);
assert.equal(media.jobDefaults.music, 'rights-cleared-only');
assert.equal(media.jobDefaults.thumbnailRequired, true);

console.log('media master contract passed: 213 semantic assets + 90 fail-closed calendar jobs');
