import assert from 'node:assert/strict';
import fs from 'node:fs';

const schema = JSON.parse(
  fs.readFileSync(new URL('../../../docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json', import.meta.url), 'utf8'),
);

assert.equal(schema.title, 'URAI Studio Release Evidence');
assert.equal(schema.properties.repository.const, 'LifeLoggerAI/urai-studio');
assert.ok(schema.required.includes('commitSha'));
assert.ok(schema.required.includes('recordedAt'));
assert.ok(schema.required.includes('gates'));

const requiredGates = schema.properties.gates.required;
for (const gate of ['install', 'lint', 'typecheck', 'tests', 'appBuild', 'functionsBuild', 'doneDoneGuard', 'releaseCheck', 'smoke']) {
  assert.ok(requiredGates.includes(gate), `missing release gate: ${gate}`);
}

assert.deepEqual(schema.$defs.gate.properties.status.enum, ['pass', 'fail', 'blocked', 'not_run']);
assert.equal(schema.$defs.gate.required.includes('status'), true);
assert.equal(schema.$defs.gate.required.includes('evidence'), true);

console.log('release evidence schema coverage passed');
