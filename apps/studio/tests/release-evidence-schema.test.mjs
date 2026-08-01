import assert from 'node:assert/strict';
import fs from 'node:fs';

const schema = JSON.parse(
  fs.readFileSync(new URL('../../../docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json', import.meta.url), 'utf8'),
);

assert.equal(schema.title, 'URAI Studio Release Evidence');
assert.equal(schema.properties.repository.const, 'LifeLoggerAI/urai-studio');
for (const field of ['commitSha', 'recordedAt', 'environment', 'gates']) {
  assert.ok(schema.required.includes(field), `missing required release evidence field: ${field}`);
}
assert.equal(schema.properties.commitSha.pattern, '^[0-9a-f]{40}$');

const requiredGates = schema.properties.gates.required;
for (const gate of [
  'install',
  'lint',
  'typecheck',
  'tests',
  'appBuild',
  'functionsBuild',
  'doneDoneGuard',
  'releaseCheck',
  'providerReadiness',
  'binaryArtifacts',
  'smoke',
]) {
  assert.ok(requiredGates.includes(gate), `missing release gate: ${gate}`);
}

assert.deepEqual(schema.$defs.gate.properties.status.enum, ['pass', 'fail', 'blocked', 'not_run']);
assert.equal(schema.$defs.gate.required.includes('status'), true);
assert.equal(schema.$defs.gate.required.includes('evidence'), true);
assert.equal(schema.$defs.gate.properties.evidence.minLength, 1);

console.log('release evidence schema coverage passed');
