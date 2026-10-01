import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

function loadTs(path) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
}

const foundry = await loadTs('../lib/studio/film-foundry.ts');
const cutOne = await loadTs('../lib/studio/cut-one.ts');
const brain = await loadTs('../lib/studio/brain-map.ts');

const baseFoundry = {
  productionId: 'finite-time',
  privateAuthorityRef: 'drive:finite-time-authority',
  phase: 'shots',
  state: 'approved',
  assetRefs: ['asset:1'],
  versionRefs: ['version:1'],
  reviewRefs: ['review:1'],
  approvalRefs: ['approval:1'],
  blockerRefs: [],
  evidenceRefs: ['evidence:1'],
  canonState: 'ready',
  consentState: 'ready',
  continuityState: 'ready',
  factualConfidenceState: 'ready',
  rightsState: 'cleared',
  accessibilityState: 'ready',
  providerState: 'hard-off',
  costState: 'bounded',
  renderState: 'proof',
  masterState: 'not-started',
  releaseState: 'private-only',
};

const foundryReady = foundry.createFilmFoundryControl(baseFoundry);
assert.equal(foundryReady.providerSpendAuthorized, false);
assert.equal(foundryReady.publicReleaseAuthorized, false);
assert.equal(foundry.filmFoundryCanAdvance(foundryReady), true);

for (const [field, value, blocker] of [
  ['canonState', 'blocked', 'film_foundry_canon_not_ready'],
  ['consentState', 'unknown', 'film_foundry_consent_not_ready'],
  ['continuityState', 'blocked', 'film_foundry_continuity_not_ready'],
  ['factualConfidenceState', 'unknown', 'film_foundry_factual_confidence_not_ready'],
  ['costState', 'unapproved', 'film_foundry_budget_not_bounded'],
]) {
  const record = foundry.createFilmFoundryControl({ ...baseFoundry, [field]: value });
  assert.equal(foundry.filmFoundryCanAdvance(record), false);
  assert.ok(foundry.filmFoundryAdvanceBlockers(record).includes(blocker));
}

const scenes = cutOne.CUT_ONE_REQUIRED_SCENES.map((id) => ({
  id,
  title: id,
  state: 'approved',
  sourceAuthorityRefs: [`authority:${id}`],
  scriptRefs: [`script:${id}`],
  assetRefs: [`asset:${id}`],
  approvalRefs: [`approval:${id}`],
  exportRefs: [],
  stagingEvidenceRefs: [],
  releaseEvidenceRefs: [],
}));

const board = cutOne.createCutOneProductionBoard({
  productionId: 'cut-one',
  sourceAuthorityRefs: ['issue:46'],
  scenes,
  scriptTrackerRefs: ['issue:49'],
  assetTrackerRefs: ['tracker:assets'],
  approvalTrackerRefs: ['tracker:approvals'],
  exportTrackerRefs: ['tracker:exports'],
  stagingChecklistRefs: ['checklist:staging'],
  releaseChecklistRefs: ['checklist:release'],
});
assert.equal(board.providerExecutionAuthorized, false);
assert.equal(board.publicReleaseAuthorized, false);
assert.equal(cutOne.evaluateCutOneBoardReadiness(board).sourceReady, true);
assert.throws(
  () => cutOne.createCutOneProductionBoard({ ...board, scenes: scenes.slice(1) }),
  /cut_one_required_scene_missing/,
);

const nodes = [
  {
    id: 'studio',
    kind: 'repository',
    label: 'URAI Studio',
    ownerSystem: 'urai-studio',
    systemLayer: 'studio',
    healthState: 'healthy',
    exactSha: 'a'.repeat(40),
    sourceRef: 'github:LifeLoggerAI/urai-studio',
    metadataRefs: ['repo:metadata'],
    diagnosticRefs: [],
    evidenceRefs: ['workflow:green'],
    evidenceState: 'machine-green',
    evidenceFreshnessAt: '2026-09-24T08:00:00.000Z',
    blockerRefs: [],
  },
  {
    id: 'spatial',
    kind: 'repository',
    label: 'URAI Spatial',
    ownerSystem: 'urai-spatial',
    systemLayer: 'spatial',
    healthState: 'degraded',
    sourceRef: 'github:LifeLoggerAI/urai-spatial',
    metadataRefs: ['repo:metadata'],
    diagnosticRefs: [],
    evidenceRefs: [],
    evidenceState: 'source-only',
    evidenceFreshnessAt: '2026-09-24T08:00:00.000Z',
    blockerRefs: ['deployment:unverified'],
  },
];
const cockpit = brain.createBrainMapCockpit(nodes, [
  { from: 'studio', to: 'spatial', relationship: 'depends-on', sourceRef: 'contract:studio-spatial' },
]);
assert.equal(cockpit.activationAuthorized, false);
assert.equal(brain.filterBrainMapNodes(nodes, { layers: ['studio'] }).length, 1);
assert.equal(brain.filterBrainMapNodes(nodes, { healthStates: ['degraded'] })[0].id, 'spatial');
assert.throws(
  () => brain.createBrainMapCockpit(nodes, [{ from: 'studio', to: 'missing', relationship: 'depends-on', sourceRef: 'bad' }]),
  /brain_map_edge_node_missing/,
);

console.log('Studio dormant future control models guard passed');
