import assert from 'node:assert/strict';
import fs from 'node:fs';

const film = fs.readFileSync(new URL('../components/studio/future/FilmFoundryControlPanel.tsx', import.meta.url), 'utf8');
const brain = fs.readFileSync(new URL('../components/studio/future/BrainMapEvidenceList.tsx', import.meta.url), 'utf8');
const cut = fs.readFileSync(new URL('../components/studio/future/CutOneControlPanel.tsx', import.meta.url), 'utf8');

for (const token of ['Rights', 'Accessibility', 'Cost', 'Render', 'Master', 'Release']) {
  assert.ok(film.includes(token), `Film Foundry control panel missing ${token}`);
}
assert.ok(film.includes('Execution remains hard-off'));

for (const token of ['Evidence state', 'Exact SHA', 'Evidence receipts', 'Blockers', 'accessible list']) {
  assert.ok(brain.includes(token), `Brain Map accessible control missing ${token}`);
}
assert.ok(brain.includes('No raw memories'));

for (const token of ['source authorities', 'approvals', 'staging receipts', 'release receipts']) {
  assert.ok(cut.includes(token), `Cut One control panel missing ${token}`);
}
assert.ok(cut.includes('Provider execution and public release remain disabled'));

const activeRouteSources = [
  '../app/studio/page.tsx',
  '../app/layout.tsx',
].map((path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n');

for (const component of ['FilmFoundryControlPanel', 'BrainMapEvidenceList', 'CutOneControlPanel']) {
  assert.ok(!activeRouteSources.includes(component), `${component} must remain unexposed while hard-off`);
}

console.log('Studio dormant control-plane UI guard passed');

const filmFoundryPanel = fs.readFileSync(new URL('../components/studio/future/FilmFoundryControlPanel.tsx', import.meta.url), 'utf8');
const cutOnePanel = fs.readFileSync(new URL('../components/studio/future/CutOneControlPanel.tsx', import.meta.url), 'utf8');

for (const marker of [
  'canonState',
  'consentState',
  'continuityState',
  'factualConfidenceState',
  'filmFoundryAdvanceBlockers',
  'filmFoundryCanAdvance',
  'data-provider-spend-authorized="false"',
  'data-public-release-authorized="false"',
]) {
  assert.ok(filmFoundryPanel.includes(marker), `Film Foundry UI missing gate marker: ${marker}`);
}

for (const marker of [
  'CutOneProductionBoard',
  'evaluateCutOneBoardReadiness',
  'Cut One canonical scene production board',
  'scriptTrackerRefs',
  'assetTrackerRefs',
  'approvalTrackerRefs',
  'exportTrackerRefs',
  'stagingChecklistRefs',
  'releaseChecklistRefs',
  'data-provider-execution-authorized="false"',
  'data-public-release-authorized="false"',
]) {
  assert.ok(cutOnePanel.includes(marker), `Cut One UI missing command-board marker: ${marker}`);
}
