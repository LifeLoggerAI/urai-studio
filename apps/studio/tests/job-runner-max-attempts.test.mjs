import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../../functions/src/job-runner.ts', import.meta.url), 'utf8');

assert.ok(source.includes('type ClaimOutcome = "skipped" | "claimed" | "max_attempts"'));
assert.ok(source.includes('runTransaction<ClaimOutcome>'));
assert.ok(source.includes('return "max_attempts"'));
assert.ok(source.includes('if (claimOutcome === "max_attempts")'));
assert.ok(source.includes('if (claimOutcome !== "claimed")'));
assert.ok(source.indexOf('if (claimOutcome === "max_attempts")') < source.indexOf('const output = await processJob'));

console.log('job runner maximum-attempt checks passed');
