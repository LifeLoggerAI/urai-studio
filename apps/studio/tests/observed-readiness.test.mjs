import assert from 'node:assert/strict';
import fs from 'node:fs';

const observed = fs.readFileSync(new URL('../lib/studio/observed-readiness.ts', import.meta.url), 'utf8');
const integrations = fs.readFileSync(new URL('../lib/studio/integrations.ts', import.meta.url), 'utf8');
const readyz = fs.readFileSync(new URL('../app/readyz/route.ts', import.meta.url), 'utf8');
const health = fs.readFileSync(new URL('../app/api/system/health/route.ts', import.meta.url), 'utf8');

for (const profile of ['PUBLIC_SITE', 'FULL_STUDIO_PLATFORM', 'PROVIDER_EXECUTION', 'SPATIAL_HANDOFF', 'MEDIA_PRODUCTION']) {
  assert.ok(observed.includes(profile), `missing readiness profile: ${profile}`);
}
for (const state of ['missing', 'unreachable', 'unauthorized', 'degraded', 'healthy', 'hard-off']) {
  assert.ok(observed.includes(`'${state}'`), `missing observed readiness state: ${state}`);
}
for (const token of ['AbortController', '2200', 'maxAttempts = 2', 'X-URAI-Correlation-ID', 'Authorization']) {
  assert.ok(observed.includes(token), `observed health implementation missing: ${token}`);
}
assert.ok(observed.includes('activationAuthorized: false'), 'readiness profiles may never authorize activation');
assert.ok(observed.includes("PROVIDER_EXECUTION: { required: ['asset-factory'], hardOff: true }"));
assert.ok(observed.includes("SPATIAL_HANDOFF: { required: ['spatial'], hardOff: true }"));
assert.ok(observed.includes("MEDIA_PRODUCTION: { required: ['asset-factory', 'spatial'], hardOff: true }"));

assert.ok(integrations.includes('publicIntegrationDiagnostics'), 'integration config must expose a sanitized public projection');
assert.ok(readyz.includes('parseReadinessProfile'), 'readyz must support explicit readiness profiles');
assert.ok(readyz.includes('observeAllStudioIntegrations'), 'readyz must use observed integration health');
assert.ok(health.includes('publicIntegrationDiagnostics'), 'health response must use sanitized integration configuration');
assert.ok(health.includes('buildAllReadinessProfiles'), 'health response must report observed profiles');
assert.ok(!health.includes('integrations: studioIntegrations'), 'public health must not emit raw configured URLs/env keys');

console.log('Studio observed readiness and redaction guard passed');
