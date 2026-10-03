import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../lib/life-model-contract.ts', import.meta.url), 'utf8');
const contract = JSON.parse(fs.readFileSync(new URL('../../../contracts/life-model-v1.json', import.meta.url), 'utf8'));

test('Studio pins the canonical Life Model contract', () => {
  assert.equal(contract.schemaVersion, 'urai-life-model-v1');
  assert.equal(contract.invariants.syntheticOutputMayBecomeHistoricalSource, false);
  assert.match(source, /LIFE_MODEL_SCHEMA_VERSION = 'urai-life-model-v1'/);
  assert.match(source, /syntheticOutputMayBecomeHistoricalSource: false/);
});

test('Studio canonical SceneTruth has fail-closed contradiction and occlusion states', () => {
  assert.match(source, /decision = 'BLOCKED'/);
  assert.match(source, /decision = 'READY_WITH_OCCLUSION'/);
  assert.match(source, /decision = 'READY_INTERPRETIVE'/);
});

test('generated media cannot become archival source authority', () => {
  assert.match(source, /GENERATED_ASSET_CANNOT_BE_SOURCE_CAPTURED/);
  assert.match(source, /SIMULATION_CANNOT_CREATE_HISTORICAL_EVIDENCE/);
});
