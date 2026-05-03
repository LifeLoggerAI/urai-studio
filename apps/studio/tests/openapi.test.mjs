import assert from 'node:assert/strict';
import spec from '../system/urai-studio.openapi.json' with { type: 'json' };
assert.equal(spec.openapi,'3.0.3');
for (const p of ['/api/system/health','/api/system/manifest','/api/system/capabilities','/api/system/integration-contract','/api/system/openapi','/api/integrations/asset-factory/health','/api/integrations/asset-factory/manifest']) assert.ok(spec.paths[p]);
console.log('openapi contract passed');
