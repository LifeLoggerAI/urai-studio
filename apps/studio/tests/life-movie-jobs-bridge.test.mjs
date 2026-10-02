import assert from 'node:assert/strict';
import fs from 'node:fs';

const bridge = fs.readFileSync(new URL('../lib/studio-life-movie-jobs-bridge.ts', import.meta.url), 'utf8');
const route = fs.readFileSync(new URL('../app/api/studio/video-factory/jobs-contract/route.ts', import.meta.url), 'utf8');

assert.ok(bridge.includes("jobType: 'studio.render.video' as const"));
assert.ok(bridge.includes("schemaVersion: 'urai-life-movie-render-v1' as const"));
assert.ok(bridge.includes("schemaVersion: 'urai-studio-jobs-envelope-1' as const"));
assert.ok(bridge.includes("providerGenerationAuthorized: false as const"));
assert.ok(bridge.includes("publicReleaseAuthorized: false as const"));
assert.ok(bridge.includes("spatialRequired: false as const"));
assert.ok(bridge.includes("executionAuthority: 'urai-jobs' as const"));
assert.ok(bridge.includes("dispatchAuthorized: false as const"));
assert.ok(bridge.includes("tenants/"));
assert.ok(bridge.includes("/life-movies/"));
assert.ok(bridge.includes("studios/"));
assert.ok(bridge.includes("life_movie_source_outside_tenant"));
assert.ok(bridge.includes("life_movie_invalid_consent_ref"));
assert.ok(bridge.includes("life_movie_invalid_rights_ref"));
assert.ok(bridge.includes("life_movie_pixel_frame_budget_exceeded"));
assert.ok(bridge.includes('sceneTruthReceiptRef: string'));
assert.ok(bridge.includes('life_movie_invalid_scene_truth_receipt'));
assert.ok(bridge.includes('sceneTruthReceiptRef,'));
assert.ok(bridge.includes("createHash('sha256')"));
assert.ok(bridge.includes("maxDurationMs: 30_000"));
assert.ok(bridge.includes("maxSources: 12"));

assert.ok(route.includes('requireStudioAuth(request)'));
assert.ok(route.includes('tenantId: auth.tenantId'));
assert.ok(route.includes('buildJobsLifeMovieEnvelope({'));
assert.ok(route.includes('sceneTruthReceiptRef: typeof body.sceneTruthReceiptRef'));
assert.ok(route.includes("requiredSceneFields:['sceneTruthReceiptRef']"));
assert.ok(route.includes("status:'jobs-contract-built'"));
assert.ok(route.includes("status:'jobs-contract-rejected'"));
assert.ok(route.includes('dispatchAuthorized:false'));
assert.ok(route.includes('providerGenerationAuthorized:false'));
assert.ok(route.includes('publicReleaseAuthorized:false'));
assert.equal(route.includes('fetch('), false);
assert.equal(route.includes('axios'), false);

console.log('Life Movie Jobs bridge contract passed');
