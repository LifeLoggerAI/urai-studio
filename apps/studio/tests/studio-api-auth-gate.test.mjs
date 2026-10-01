import assert from 'node:assert/strict';
import fs from 'node:fs';

const jobsRoute = fs.readFileSync(new URL('../app/api/studio/jobs/route.ts', import.meta.url), 'utf8');
const exportsRoute = fs.readFileSync(new URL('../app/api/studio/exports/route.ts', import.meta.url), 'utf8');
const videoFactoryRoute = fs.readFileSync(new URL('../app/api/studio/video-factory/route.ts', import.meta.url), 'utf8');
const authHelper = fs.readFileSync(new URL('../lib/studio-auth.ts', import.meta.url), 'utf8');

for (const [name, source] of [['jobs route', jobsRoute], ['exports route', exportsRoute], ['video factory route', videoFactoryRoute]]) {
  assert.ok(source.includes('requireStudioAuth(req)'), `${name} must require Studio auth`);
  assert.ok(source.includes('authErrorResponse(auth)'), `${name} must return the shared auth error response`);
  assert.ok(source.includes('Cache-Control'), `${name} responses must avoid cached private data`);
  assert.ok(source.includes("studio_membership_lookup_failed' ? 503"), `${name} must distinguish membership-service failure from authentication failure`);
  assert.ok(source.includes("studio_edit_role_required' ? 403 : 401"), `${name} must distinguish authenticated role denial from missing authentication`);
}

for (const token of ['missing_bearer_token', 'firebase_admin_unavailable', 'invalid_bearer_token', 'missing_studio_scope', 'studio_membership_required', 'studio_edit_role_required', "verifyIdToken(token, true)"]) {
  assert.ok(authHelper.includes(token), `auth helper missing fail-closed token: ${token}`);
}

console.log('Studio API token and canonical-membership auth gate passed');
