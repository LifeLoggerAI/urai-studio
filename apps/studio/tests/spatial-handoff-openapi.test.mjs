import assert from 'node:assert/strict';
import spec from '../system/spatial-handoff.openapi.json' with { type: 'json' };

assert.equal(spec.openapi, '3.0.3');
assert.ok(spec.paths['/api/system/spatial-handoff']);
assert.ok(spec.paths['/api/system/spatial-handoff'].get);

console.log('spatial handoff openapi fragment passed');
