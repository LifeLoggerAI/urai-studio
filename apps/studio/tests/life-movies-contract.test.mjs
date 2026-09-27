import assert from 'node:assert/strict';
import fs from 'node:fs';

const life = fs.readFileSync(new URL('../lib/studio/life-movies.ts', import.meta.url), 'utf8');
const route = fs.readFileSync(new URL('../app/api/studio/life-movies/route.ts', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../lib/studio/life-movie-jobs-bridge.ts', import.meta.url), 'utf8');
const store = fs.readFileSync(new URL('../lib/studio-runtime-store.ts', import.meta.url), 'utf8');
const page = fs.readFileSync(new URL('../app/studio/life-movies/page.tsx', import.meta.url), 'utf8');

for (const token of [
  "'original-source'",
  "'user-provided-fact'",
  "'verified-metadata'",
  "'user-recorded-memory'",
  "'inferred'",
  "'reconstructed'",
  "'generated'",
  "'artistic-interpretation'",
  "'unknown'",
  "spatialRequired: false",
  "privateByDefault: true",
  "publicReleaseAuthorized: false",
  "providerGenerationAuthorized: false",
  "renderEngine: 'ffmpeg-worker'",
  "requestedExports: ['mp4', 'srt', 'json']",
  'source_consent_required',
  'source_rights_required',
  'source_provenance_required',
]) assert.ok(life.includes(token), `Life Movies contract missing ${token}`);

assert.ok(route.includes('requireStudioAuth'), 'Life Movies API must use canonical Studio auth');
assert.ok(route.includes("kind: 'video_generation'"), 'Life Movies must queue through canonical Studio video jobs');
assert.ok(route.includes('createStudioProject'), 'Life Movies projects must persist in the canonical Studio project model');
assert.ok(route.includes('createStudioJob'), 'Life Movies must use canonical Studio job persistence');
assert.ok(route.includes('dispatchLifeMovieRender'), 'Life Movies must dispatch heavy rendering to URAI Jobs');
assert.ok(route.includes('getLifeMovieRenderStatus'), 'Life Movies must expose render status');
assert.ok(route.includes('cancelLifeMovieRender'), 'Life Movies must expose render cancellation');
assert.ok(route.includes('dispatched: true'), 'Life Movies may claim queued only after Jobs accepts the render');
assert.ok(bridge.includes('URAI_JOBS_LIFE_MOVIE_BRIDGE_TOKEN'), 'Studio-to-Jobs execution must use a server-only bridge token');
assert.ok(bridge.includes('URAI_STUDIO_STORAGE_BUCKET'), 'relative Studio media paths must bind to an explicit source bucket');
assert.ok(bridge.includes('life_movie_source_not_staged_for_render'), 'un-staged web/private sources must fail closed before render dispatch');
assert.ok(bridge.includes('schemaVersion: LIFE_MOVIE_JOBS_CONTRACT.schemaVersion'), 'Studio must emit the canonical Jobs render contract authority');
assert.ok(store.includes("projectType: input.projectType"), 'Studio project persistence must retain the Life Movie project type');
assert.ok(store.includes('externalExecution'), 'Studio job records must retain Jobs execution linkage');
assert.ok(route.includes('providerGenerationAuthorized: false'), 'provider generation must remain fail-closed');
assert.ok(page.includes('does not depend on Spatial'), 'public Studio copy must state the non-Spatial video path');
assert.ok(page.includes('MP4 · SRT · JSON'), 'Life Movies page must expose ordinary video/caption/manifest outputs');

console.log('Life Movies launch contract guard passed');


const featurePolicy = fs.readFileSync(new URL('../lib/studio/feature-policy.ts', import.meta.url), 'utf8');
const lifeMoviesRoute = fs.readFileSync(new URL('../app/api/studio/life-movies/route.ts', import.meta.url), 'utf8');

assert.ok(featurePolicy.includes("'life-movies-render'"), 'Life Movies render feature must exist');
const hardOffBlock = featurePolicy.match(/const HARD_OFF_FEATURES = new Set<StudioFeatureId>\(\[([\s\S]*?)\]\);/)?.[1] ?? '';
assert.ok(hardOffBlock.includes("'life-movies-render'"), 'Life Movies render must remain in the hard-off set');
assert.ok(lifeMoviesRoute.includes("resolveStudioFeaturePolicy('life-movies-render')"));
assert.ok(lifeMoviesRoute.includes("canExecuteStudioFeature('life-movies-render')"));
assert.ok(lifeMoviesRoute.includes("status: 'life_movies_render_hard_off'"));
assert.ok(lifeMoviesRoute.indexOf("life_movies_render_hard_off") < lifeMoviesRoute.indexOf("createStudioProject({"), 'hard-off gate must precede persistent project creation');
assert.ok(lifeMoviesRoute.indexOf("life_movies_render_hard_off") < lifeMoviesRoute.indexOf("dispatchLifeMovieRender({"), 'hard-off gate must precede Jobs dispatch');


const lifeMoviesSource = fs.readFileSync(new URL('../lib/studio/life-movies.ts', import.meta.url), 'utf8');
const lifeMovieBridge = fs.readFileSync(new URL('../lib/studio/life-movie-jobs-bridge.ts', import.meta.url), 'utf8');

for (const token of [
  "jobType: 'studio.render.video'",
  "schemaVersion: 'urai-life-movie-render-v1'",
  'maxSources: 100',
  'maxTimelineItems: 250',
  'maxTimelineItemMs: 30 * 60 * 1000',
  'maxTotalTimelineMs: 45 * 60 * 1000',
  'maxBridgeBodyBytes: 32768',
]) {
  assert.ok(lifeMoviesSource.includes(token), `Life Movies Jobs contract missing: ${token}`);
}
assert.ok(lifeMovieBridge.includes("ownerRepo: 'LifeLoggerAI/urai-jobs'"));
assert.ok(lifeMovieBridge.includes("actions: ['create', 'status', 'cancel']"));
assert.ok(lifeMovieBridge.includes("auth: 'protected-bearer'"));
assert.ok(lifeMovieBridge.includes('validateLifeMovieBridgeRequest'));
assert.ok(lifeMovieBridge.includes('life_movie_jobs_bridge_request_too_large'));


const lifeMoviesPage = fs.readFileSync(new URL('../app/studio/life-movies/page.tsx', import.meta.url), 'utf8');
const studioPage = fs.readFileSync(new URL('../app/studio/page.tsx', import.meta.url), 'utf8');
const activeRoutes = fs.readFileSync(new URL('./routes-smoke.mjs', import.meta.url), 'utf8');

assert.ok(lifeMoviesPage.includes("canExecuteStudioFeature('life-movies-render')"));
assert.ok(lifeMoviesPage.includes('notFound()'), 'hard-off Life Movies page must fail closed to notFound');
assert.ok(!studioPage.includes('href="/studio/life-movies"'), 'hard-off Life Movies must not be linked from active Studio navigation');
assert.ok(!activeRoutes.includes("'/studio/life-movies'"), 'hard-off Life Movies must not be in active route smoke');
assert.ok(!activeRoutes.includes("'/api/studio/life-movies'"), 'hard-off Life Movies API must not be in active route smoke');
