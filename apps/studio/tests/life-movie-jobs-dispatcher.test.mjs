import assert from 'node:assert/strict';
import fs from 'node:fs';

const client = fs.readFileSync(new URL('../lib/studio-life-movie-jobs-client.ts', import.meta.url), 'utf8');
const route = fs.readFileSync(new URL('../app/api/studio/video-factory/jobs-dispatch/route.ts', import.meta.url), 'utf8');

assert.ok(client.includes("import 'server-only'"));
assert.ok(client.includes("URAI_STUDIO_JOBS_DISPATCH_ENABLED"));
assert.ok(client.includes("URAI_JOBS_BRIDGE_URL"));
assert.ok(client.includes("URAI_STUDIO_JOBS_BRIDGE_TOKEN"));
assert.ok(client.includes("url.protocol === 'https:'"));
assert.ok(client.includes("url.protocol === 'http:' && loopback"));
assert.ok(client.includes("jobs_bridge_url_not_approved"));
assert.ok(client.includes("dispatchAvailable: enabled && configured"));
assert.ok(client.includes("authorization: `Bearer ${token}`"));
assert.ok(client.includes("jobs_bridge_timeout"));
assert.equal(client.includes('NEXT_PUBLIC_URAI_STUDIO_JOBS_BRIDGE_TOKEN'), false);
assert.equal(client.includes('console.log(token'), false);

assert.ok(route.includes('requireStudioAuth(request)'));
assert.ok(route.includes("status:'dispatch-unavailable'"));
assert.ok(route.includes("action:'create'"));
assert.ok(route.includes('tenantId:auth.tenantId'));
assert.ok(route.includes('userId:auth.uid'));
assert.ok(route.includes('idempotencyKey:envelope.idempotencyKey'));
assert.ok(route.includes('publicReleaseAuthorized:false'));
assert.ok(route.includes('providerGenerationAuthorized:false'));
assert.ok(route.includes("executionAuthority:'urai-jobs'"));

console.log('Life Movie Jobs dispatcher contract passed');
