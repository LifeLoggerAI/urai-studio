import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jobsRoute = readFileSync(new URL('../app/api/studio/jobs/route.ts', import.meta.url), 'utf8');

assert.ok(jobsRoute.includes('STUDIO_JOB_KINDS'));
assert.ok(jobsRoute.includes('STUDIO_EXPORT_KINDS'));
assert.ok(jobsRoute.includes("status: 'invalid_job_kind'"));
assert.ok(jobsRoute.includes("status: 'invalid_export_kind'"));
assert.ok(jobsRoute.indexOf("status: 'invalid_job_kind'") < jobsRoute.indexOf('createStudioJob({'));
assert.ok(jobsRoute.indexOf("status: 'invalid_export_kind'") < jobsRoute.indexOf('createStudioJob({'));

console.log('Studio API kind validation regression checks passed');
