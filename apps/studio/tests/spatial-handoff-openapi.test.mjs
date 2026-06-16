import assert from 'node:assert/strict';
import fragmentSpec from '../system/spatial-handoff.openapi.json' with { type: 'json' };
import canonicalSpec from '../system/urai-studio.openapi.json' with { type: 'json' };

const route = '/api/system/spatial-handoff';

assert.equal(fragmentSpec.openapi, '3.0.3');
assert.ok(fragmentSpec.paths[route]);
assert.ok(fragmentSpec.paths[route].get);

assert.equal(canonicalSpec.openapi, '3.0.3');
assert.ok(canonicalSpec.paths[route], 'canonical Studio OpenAPI must include the Spatial handoff route');
assert.ok(canonicalSpec.paths[route].get, 'canonical Studio OpenAPI must expose the Spatial handoff GET contract');

console.log('spatial handoff openapi fragment and canonical route passed');
