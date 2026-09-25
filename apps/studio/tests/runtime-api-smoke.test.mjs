import assert from 'node:assert/strict';
import fs from 'node:fs';

const smoke = fs.readFileSync(new URL('../../../scripts/smoke.sh', import.meta.url), 'utf8');
const healthRoute = fs.readFileSync(new URL('../app/api/integrations/asset-factory/health/route.ts', import.meta.url), 'utf8');
const manifestRoute = fs.readFileSync(new URL('../app/api/integrations/asset-factory/manifest/route.ts', import.meta.url), 'utf8');

for (const route of [
  '/api/system/health',
  '/api/system/manifest',
  '/api/system/capabilities',
  '/api/system/openapi',
  '/api/integrations/asset-factory/health',
  '/api/integrations/asset-factory/manifest',
]) {
  assert.ok(smoke.includes(route), `runtime smoke must exercise ${route}`);
}

assert.ok(smoke.includes("const route = process.argv[2]"), 'degraded smoke verifier must bind the requested route');
assert.ok(smoke.includes("['disconnected', 'fallback'].includes(data.status)"), 'Asset Factory degraded states must be validated explicitly');

for (const source of [healthRoute, manifestRoute]) {
  assert.ok(source.includes('status:') && source.includes('ok ? 200 : 503'), 'Asset Factory bridge routes must fail closed when disconnected');
  assert.ok(source.includes("'Cache-Control': 'no-store, max-age=0'"), 'Asset Factory bridge responses must not be cached');
}

console.log('Studio runtime API and Asset Factory smoke guard passed');
