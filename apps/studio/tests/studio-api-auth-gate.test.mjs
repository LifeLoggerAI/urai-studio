import assert from 'node:assert/strict';
import fs from 'node:fs';

const jobsRoute = fs.readFileSync(new URL('../app/api/studio/jobs/route.ts', import.meta.url), 'utf8');
const exportsRoute = fs.readFileSync(new URL('../app/api/studio/exports/route.ts', import.meta.url), 'utf8');
const authHelper = fs.readFileSync(new URL('../lib/studio-auth.ts', import.meta.url), 'utf8');

for (const [name, source] of [
  ['jobs route', jobsRoute],
  ['exports route', exportsRoute],
]) {
  assert.ok(source.includes('requireStudioAuth(req)'), `${name} must require Studio auth`);
  assert.ok(source.includes('authErrorResponse(auth)'), `${name} must return the shared auth error response`);
  assert.ok(source.includes('Cache-Control'), `${name} responses must avoid cached private data`);
}

assert.ok(authHelper.includes('process.env.NODE_ENV === \'production\''), 'auth helper must branch on production mode');
assert.ok(authHelper.includes('missing_bearer_token'), 'auth helper must reject missing bearer token in production');
assert.ok(authHelper.includes('firebase_admin_auth_unavailable'), 'auth helper must fail closed when Admin Auth is unavailable');
assert.ok(authHelper.includes('invalid_bearer_token'), 'auth helper must reject invalid bearer token');

console.log('studio API auth gate regression passed');
