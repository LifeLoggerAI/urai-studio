import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../../functions/src/job-runner.ts', import.meta.url), 'utf8');

assert.match(source, /type ClaimOutcome =/);
assert.match(source, /status: "skipped"/);
assert.match(source, /status: "claimed"/);
assert.match(source, /status: "max_attempts"/);
assert.match(source, /runTransaction<ClaimOutcome>/);
assert.match(source, /return \{ status: "max_attempts", before: jobData, job: terminalJobData \}/);
assert.match(source, /return \{ status: "claimed", before: jobData, job: claimedJobData \}/);
assert.match(source, /if \(claimOutcome\.status === "max_attempts"\)/);
assert.match(source, /if \(claimOutcome\.status !== "claimed"\)/);
assert.match(source, /const claimedJobData = claimOutcome\.job/);
assert.doesNotMatch(source, /const terminalJobData = \(await jobRef\.get\(\)\)/);
assert.doesNotMatch(source, /const claimedJobData = \(await jobRef\.get\(\)\)/);

const terminalBranchStart = source.indexOf('if (claimOutcome.status === "max_attempts")');
const terminalBranchEnd = source.indexOf('if (claimOutcome.status !== "claimed")', terminalBranchStart);
assert.notEqual(terminalBranchStart, -1, 'maximum-attempt terminal branch must exist');
assert.notEqual(terminalBranchEnd, -1, 'claimed-branch boundary must exist');
const terminalBranch = source.slice(terminalBranchStart, terminalBranchEnd);
assert.match(terminalBranch, /writeAuditLog\(/);
assert.doesNotMatch(terminalBranch, /jobRef\.get\(/, 'maximum-attempt audit must use transaction-bound data');

assert.match(source, /if \(errorStack\) error\.stack = errorStack/);
assert.ok(
  source.indexOf('if (claimOutcome.status === "max_attempts")') < source.indexOf('const output = await processJob'),
);

console.log('job runner transaction and maximum-attempt checks passed');
