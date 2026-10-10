import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { readyTailWindow } from '../../../scripts/studio-video-ready-tail.mjs';

const factory = fs.readFileSync(new URL('../lib/studio-video-factory.ts', import.meta.url), 'utf8');
const capture = fs.readFileSync(new URL('../../../scripts/studio-video-route-capture.mjs', import.meta.url), 'utf8');
const composer = fs.readFileSync(new URL('../../../scripts/studio-video-compose-motion.mjs', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../../../.github/workflows/video-factory-verification.yml', import.meta.url), 'utf8');

for (const route of [
  "/life-map/?demo=1&manifestId=replay-recovery-thread&overview=1",
  "/focus?memoryId=quiet-reset&manifestId=replay-recovery-thread&node=quiet-reset&returnNode=quiet-reset&demo=1&from=life-map",
  "/replay?memoryId=quiet-reset&manifestId=replay-recovery-thread&node=quiet-reset&returnNode=quiet-reset&demo=1&from=life-map",
  "/passport/?demo=1",
]) {
  assert.ok(factory.includes(`route: '${route}'`), `Video Factory must preserve disclosed route identity: ${route}`);
}

assert.doesNotMatch(factory, /label: 'Focus Chamber'/);
assert.doesNotMatch(factory, /label: 'Replay Chamber'/);
assert.match(factory, /label: 'Focus Memory Star'/);
assert.match(factory, /label: 'Replay Memory Environment'/);
assert.match(factory, /One star opens into focus./);
assert.match(factory, /Focus becomes a lived replay./);

for (const token of [
  'recordVideo:',
  'semanticReadyOffsetSeconds',
  'data-testid="urai-true-3d-life-map"',
  'data-testid="urai-final-focus-chamber"',
  'data-memory-status',
  "data-memory-id') === 'demo:quiet-reset'",
  'data-testid="cinematic-replay-client"',
  'data-replay-spatial-owner="r3f-immersive-memory-field"',
  'data-route-owner="passport-ownership-vault"',
  "data-passport-source') === 'demo'",
  'data-testid="urai-final-status-control-room"',
  'video_factory_route_capture_failed',
]) {
  assert.ok(capture.includes(token), `route capture must retain semantic evidence token: ${token}`);
}

for (const token of [
  'DIAGNOSTIC_PLAYABLE_MOTION_RENDER',
  'motionSource: true',
  'aaaAccepted: false',
  'finalLifeMovieAccepted: false',
  'publicReleaseAuthorized: false',
  'privateMemoryUsed: false',
  'providerGeneratedMediaUsed: false',
  'semantic-ready live product route WebM captures',
  "spawnSync(command, args",
  "'ffmpeg'",
  "'ffprobe'",
  'outputSha256',
]) {
  assert.ok(composer.includes(token), `motion composer must retain truth/evidence token: ${token}`);
}

assert.match(workflow, /Compose and verify semantic-ready motion MP4/);
assert.match(workflow, /pnpm run video-factory:compose-motion/);

// Execute the actual capture function without launching its CLI/browser. These
// explicit DOM fixtures exercise readiness decisions, not encoded frame delivery.
const readinessStart = capture.indexOf('function routePath(route)');
const readinessEnd = capture.indexOf('\nconst source = await readFile(sourcePath');
assert.ok(readinessStart >= 0 && readinessEnd > readinessStart);
const readinessSource = capture.slice(readinessStart, readinessEnd);
const homeRuntimeSelector = '.urai-home-spatial-runtime-layer';
const assetHomeSelector = '.urai-asset-home-world[data-home-primary-owner="asset-driven"]';
const webglHomeSelector = '.urai-final-home-world[data-home-spatial-renderer="webgl"]';

function homeDom({ runtime = true, runtimeReady = 'true', webglReady = 'true', loading = false,
  owner = 'asset', innerReady = 'true', width = 1280, height = 720, canvas = true, outsideRuntime = false } = {}) {
  const canvasElement = canvas ? { getBoundingClientRect: () => ({ width, height }) } : null;
  const inner = owner ? {
    getAttribute: (name) => ({ 'data-home-assets-ready': innerReady, 'data-home-ready': innerReady })[name] ?? null,
    querySelector: (selector) => selector === 'canvas' ? canvasElement : null,
  } : null;
  const findInner = (selector) => selector === (owner === 'asset' ? assetHomeSelector : webglHomeSelector) ? inner : null;
  const outer = runtime ? {
    getAttribute: (name) => ({ 'data-home-assets-ready': runtimeReady, 'data-webgl-ready': webglReady })[name] ?? null,
    querySelector: (selector) => selector === '.home-runtime-loading'
      ? (loading ? { role: 'status' } : null)
      : (outsideRuntime ? null : findInner(selector)),
  } : null;
  return { querySelector: (selector) => selector === homeRuntimeSelector ? outer : findInner(selector) };
}

function actualReadiness(document) {
  return vm.runInNewContext(`${readinessSource}\nwaitForSemanticReady;`, { document, URL });
}

for (const [name, options, ready] of [
  ['inner ready while outer Home is loading', { runtimeReady: 'false', loading: true }, false],
  ['outer ready but loading overlay still mounted', { loading: true }, false],
  ['outer assets not ready without an overlay', { runtimeReady: 'false' }, false],
  ['outer WebGL recovery', { webglReady: 'recovering' }, false],
  ['outer WebGL failure', { webglReady: 'false' }, false],
  ['missing outer readiness', { runtimeReady: null }, false],
  ['ready inner scene outside the actual runtime owner', { outsideRuntime: true }, false],
  ['ready current asset Home', {}, true],
  ['unready inner asset scene', { innerReady: 'false' }, false],
  ['missing Home scene', { owner: null }, false],
  ['missing Home canvas', { canvas: false }, false],
  ['undersized Home canvas width', { width: 239 }, false],
  ['undersized Home canvas height', { height: 239 }, false],
  ['legacy standalone asset Home', { runtime: false }, true],
  ['legacy standalone WebGL Home', { runtime: false, owner: 'webgl' }, true],
  ['unready legacy WebGL Home', { runtime: false, owner: 'webgl', innerReady: 'false' }, false],
]) {
  test(`Home semantic readiness: ${name}`, async () => {
    let observed;
    const page = { waitForFunction: async (predicate, argument, options) => {
      assert.equal(argument, null);
      assert.equal(options.timeout, 60_000);
      assert.equal(options.polling, 100);
      observed = predicate();
      if (!observed) throw new Error('synthetic_poll_not_ready');
    } };
    const result = actualReadiness(homeDom(options))(page, '/home');
    if (ready) assert.equal(await result, 'home-spatial-ready');
    else await assert.rejects(result, /synthetic_poll_not_ready/);
    assert.equal(observed, ready);
  });
}

test('Home polling resolves only after the outer runtime and loading overlay settle', async () => {
  const states = [
    { innerReady: 'false', runtimeReady: 'false', loading: true },
    { innerReady: 'true', runtimeReady: 'false', loading: true },
    { innerReady: 'true', runtimeReady: 'true', loading: true },
    { innerReady: 'true', runtimeReady: 'true', loading: false },
  ];
  let current = homeDom(states[0]);
  const observed = [];
  const document = { querySelector: (selector) => current.querySelector(selector) };
  const page = { waitForFunction: async (predicate) => {
    for (const state of states) {
      current = homeDom(state);
      const ready = predicate();
      observed.push(ready);
      if (ready) return;
    }
    throw new Error('synthetic_poll_not_ready');
  } };
  assert.equal(await actualReadiness(document)(page, '/home/'), 'home-spatial-ready');
  assert.deepEqual(observed, [false, false, false, true]);
});

for (const [route, selector, attributes, state] of [
  ['/life-map/?demo=1&manifestId=replay-recovery-thread&overview=1', '[data-testid="urai-true-3d-life-map"]',
    { 'data-life-map-mode': 'overview' }, 'life-map-overview-ready'],
  ['/focus?memoryId=quiet-reset&manifestId=replay-recovery-thread&demo=1', '[data-testid="urai-final-focus-chamber"]',
    { 'data-memory-status': 'demo', 'data-memory-id': 'demo:quiet-reset', 'data-manifest-id': 'replay-recovery-thread' }, 'focus-disclosed-demo-ready'],
  ['/replay?memoryId=quiet-reset&manifestId=replay-recovery-thread&demo=1', '[data-testid="cinematic-replay-client"][data-replay-spatial-owner="r3f-immersive-memory-field"]',
    { 'data-memory-status': 'demo', 'data-memory-id': 'demo:quiet-reset', 'data-manifest-id': 'replay-recovery-thread',
      'data-webgl-state': 'ready', 'data-replay-media-status': 'ready', 'data-replay-media-ready': 'true' }, 'replay-disclosed-demo-ready'],
  ['/passport/?demo=1', 'main[data-route-owner="passport-ownership-vault"]',
    { 'data-passport-source': 'demo' }, 'passport-disclosed-demo-ready'],
]) {
  test(`Retained route semantics: ${state}`, async () => {
    const root = { getAttribute: (name) => attributes[name] ?? null,
      querySelector: (name) => name === 'canvas' ? { getBoundingClientRect: () => ({ width: 1280, height: 720 }) } : null };
    const document = { querySelector: (name) => name === selector ? root : null };
    const page = { waitForFunction: async (predicate) => { assert.equal(predicate(), true); } };
    assert.equal(await actualReadiness(document)(page, route), state);
  });
}

test('Retained Status selection requires the visible control room', async () => {
  const page = { locator: (selector) => {
    assert.equal(selector, '[data-testid="urai-final-status-control-room"]:visible');
    return { waitFor: async (options) => {
      assert.equal(options.state, 'visible');
      assert.equal(options.timeout, 30_000);
    } };
  } };
  assert.equal(await actualReadiness({ querySelector: () => null })(page, '/status'), 'status-control-room-ready');
});

console.log('video factory semantic motion contract passed');

test('Encoded Home tail does not treat the real push wall offset as video time', () => {
  // Exact retained push11645522201: wall readiness39.09s was followed by a
  // forming veil in the incorrectly trimmed MP4. The source is71.8s long.
  const window = readyTailWindow({ sourceDurationSeconds: 71.8, usedDurationSeconds: 8,
    recordedReadySeconds: 10, semanticReadinessSampleCount: 41,
    recordingReadinessBasis: 'continuous-immediate-semantic-polls', semanticState: 'home-spatial-ready',
    semanticStateAtRecordingEnd: 'home-spatial-ready' });
  assert.ok(Math.abs(window.startSeconds - 63.3) < 1e-9);
  assert.ok(window.startSeconds > 39.09 + 8);
  assert.equal(window.literalPixelAccepted, false);
  assert.equal(window.endGuardSeconds, 0.5);
});

test('Guarded tail supports the retained PR Home and shorter route shots', () => {
  for (const [source, shot] of [[69.8, 8], [12.2, 5], [13.8, 4], [18.08, 6], [12.76, 4], [12.44, 3]]) {
    const window = readyTailWindow({ sourceDurationSeconds: source, usedDurationSeconds: shot,
      recordedReadySeconds: 10, semanticReadinessSampleCount: 41,
    recordingReadinessBasis: 'continuous-immediate-semantic-polls', semanticState: 'route-ready', semanticStateAtRecordingEnd: 'route-ready' });
    assert.equal(window.durationSeconds, shot);
    assert.ok(Math.abs(window.endSeconds - (source - 0.5)) < 1e-9);
    assert.ok(window.startSeconds >= 0);
  }
});

test('Encoded tail refuses missing final readiness and insufficient guarded recording', () => {
  const valid = { sourceDurationSeconds: 71.8, usedDurationSeconds: 8,
    recordedReadySeconds: 10, semanticReadinessSampleCount: 41,
    recordingReadinessBasis: 'continuous-immediate-semantic-polls', semanticState: 'home-spatial-ready', semanticStateAtRecordingEnd: 'home-spatial-ready' };
  for (const semanticStateAtRecordingEnd of [null, undefined, '', 'home-forming']) {
    assert.throws(() => readyTailWindow({ ...valid, semanticStateAtRecordingEnd }), /missing_or_changed_final_route_readiness/);
  }
  for (const recordedReadySeconds of [2, 8, 9.99]) {
    assert.throws(() => readyTailWindow({ ...valid, recordedReadySeconds }), /insufficient_guarded_ready_tail/);
  }
  for (const sourceDurationSeconds of [NaN, Infinity, -1, 0]) {
    assert.throws(() => readyTailWindow({ ...valid, sourceDurationSeconds }), /invalid_encoded_ready_tail_duration/);
  }
  assert.throws(() => readyTailWindow({ ...valid, sourceDurationSeconds: 8 }), /insufficient_guarded_ready_tail/);
});

test('Final Home revalidation refuses an outer loading veil with its short deadline', async () => {
  const page = { waitForFunction: async (predicate, argument, options) => {
    assert.equal(argument, null);
    assert.equal(options.timeout, 1_000);
    assert.equal(predicate(), false);
    throw new Error('synthetic_final_home_not_ready');
  } };
  await assert.rejects(actualReadiness(homeDom({ loading: true }))(page, '/home', 1_000), /synthetic_final_home_not_ready/);
});

assert.match(composer, /trim=start=\$\{window\.startSeconds\.toFixed\(3\)\}/);
assert.doesNotMatch(composer, /trim=start=\$\{readyOffset/);
assert.match(capture, /recordSemanticReadyInterval\(page, route, semanticState, recordSeconds\)/);
assert.match(capture, /semanticStateAtRecordingEnd = await assertSemanticReadyNow\(page, route\)/);
assert.match(capture, /spatial_source_changed_during_recording/);

function actualReadyRecorder(document, clock) {
  return vm.runInNewContext(`${readinessSource}\nrecordSemanticReadyInterval;`, { document, URL, Date: { now: () => clock.ms } });
}

test('Actual recorder samples the exact readiness predicate throughout ten seconds', async () => {
  const clock = { ms: 0 };
  let observations = 0;
  const page = { evaluate: async (predicate) => { observations++; return predicate(); },
    waitForTimeout: async (ms) => { clock.ms += ms; } };
  const result = await actualReadyRecorder(homeDom(), clock)(page, '/home', 'home-spatial-ready', 10);
  assert.equal(observations, 41);
  assert.equal(result.recordedReadySeconds, 10);
  assert.equal(result.semanticReadinessSampleCount, 41);
  assert.equal(result.semanticStateAtRecordingEnd, 'home-spatial-ready');
});

test('Actual recorder immediately rejects a transient Home veil without waiting for recovery', async () => {
  const clock = { ms: 0 };
  let current = homeDom();
  let observations = 0;
  const document = { querySelector: (selector) => current.querySelector(selector) };
  const page = { evaluate: async (predicate) => { observations++; return predicate(); },
    waitForTimeout: async (ms) => { clock.ms += ms; if (clock.ms === 750) current = homeDom({ loading: true }); } };
  await assert.rejects(actualReadyRecorder(document, clock)(page, '/home', 'home-spatial-ready', 10), /route_lost_semantic_readiness/);
  assert.equal(clock.ms, 750);
  assert.equal(observations, 4);
});

test('Actual recorder rejects a veil first appearing at the final observation', async () => {
  const clock = { ms: 0 };
  let current = homeDom();
  const document = { querySelector: (selector) => current.querySelector(selector) };
  const page = { evaluate: async (predicate) => predicate(),
    waitForTimeout: async (ms) => { clock.ms += ms; if (clock.ms === 10_000) current = homeDom({ loading: true }); } };
  await assert.rejects(actualReadyRecorder(document, clock)(page, '/home', 'home-spatial-ready', 10), /route_lost_semantic_readiness/);
  assert.equal(clock.ms, 10_000);
});

test('Encoded tail refuses unqualified or missing continuous recording observations', () => {
  const valid = { sourceDurationSeconds: 71.8, usedDurationSeconds: 8, recordedReadySeconds: 10,
    semanticState: 'home-spatial-ready', semanticStateAtRecordingEnd: 'home-spatial-ready',
    semanticReadinessSampleCount: 41, recordingReadinessBasis: 'continuous-immediate-semantic-polls' };
  for (const semanticReadinessSampleCount of [undefined, 0, 1, 2.5]) {
    assert.throws(() => readyTailWindow({ ...valid, semanticReadinessSampleCount }), /missing_continuous_recording_readiness/);
  }
  assert.throws(() => readyTailWindow({ ...valid, recordingReadinessBasis: 'final-check-only' }), /missing_continuous_recording_readiness/);
});

const replaySelector = '[data-testid="cinematic-replay-client"][data-replay-spatial-owner="r3f-immersive-memory-field"]';
function replayDom({ mediaStatus = 'ready', mediaReady = 'true', webglState = 'ready', statusPanel = false,
  memoryStatus = 'demo', memoryId = 'demo:quiet-reset', manifestId = 'replay-recovery-thread',
  width = 1280, height = 720, canvas = true, rootPresent = true } = {}) {
  const attributes = { 'data-memory-status': memoryStatus, 'data-memory-id': memoryId,
    'data-manifest-id': manifestId, 'data-webgl-state': webglState,
    'data-replay-media-status': mediaStatus, 'data-replay-media-ready': mediaReady };
  const root = { getAttribute: (name) => attributes[name] ?? null,
    querySelector: (selector) => selector === 'canvas'
      ? (canvas ? { getBoundingClientRect: () => ({ width, height }) } : null)
      : selector === '.replaySourceStatus' && statusPanel ? { role: 'status' } : null };
  return { querySelector: (selector) => selector === replaySelector && rootPresent ? root : null };
}

for (const [name, options, ready] of [
  ['decoded disclosed scene ready', {}, true],
  ['canvas exists while demonstration texture loads', { mediaStatus: 'loading', mediaReady: 'false' }, false],
  ['demonstration decode failed', { mediaStatus: 'error', mediaReady: 'false' }, false],
  ['media buffers after readiness', { mediaStatus: 'buffering', mediaReady: 'false' }, false],
  ['missing decoded-media status', { mediaStatus: null }, false],
  ['missing decoded-media readiness', { mediaReady: null }, false],
  ['ready status without decoded texture', { mediaReady: 'false' }, false],
  ['decoded texture without ready status', { mediaStatus: 'loading' }, false],
  ['ready markers while source status remains mounted', { statusPanel: true }, false],
  ['WebGL context failed after canvas creation', { webglState: 'failed' }, false],
  ['missing WebGL readiness', { webglState: null }, false],
  ['wrong selected memory', { memoryId: 'demo:other-memory' }, false],
  ['wrong manifest', { manifestId: 'other-manifest' }, false],
  ['ordinary memory is not the disclosed demo', { memoryStatus: 'ready' }, false],
  ['wrong or missing spatial owner', { rootPresent: false }, false],
  ['missing rendered canvas', { canvas: false }, false],
  ['undersized rendered canvas', { width: 239 }, false],
]) {
  test(`Replay semantic readiness: ${name}`, async () => {
    let observed;
    const page = { waitForFunction: async (predicate, argument, options) => {
      assert.equal(argument, null);
      assert.equal(options.timeout, 60_000);
      assert.equal(options.polling, 100);
      observed = predicate();
      if (!observed) throw new Error('synthetic_poll_not_ready');
    } };
    const result = actualReadiness(replayDom(options))(page, '/replay?memoryId=quiet-reset&demo=1');
    if (ready) assert.equal(await result, 'replay-disclosed-demo-ready');
    else await assert.rejects(result, /synthetic_poll_not_ready/);
    assert.equal(observed, ready);
  });
}

test('Replay polling retains one original deadline until decoding and source status settle', async () => {
  const states = [
    { mediaStatus: 'loading', mediaReady: 'false', statusPanel: true },
    { mediaStatus: 'ready', mediaReady: 'false', statusPanel: true },
    { mediaStatus: 'ready', mediaReady: 'true', statusPanel: true },
    { mediaStatus: 'ready', mediaReady: 'true', statusPanel: false },
  ];
  let current = replayDom(states[0]);
  const observed = [];
  let calls = 0;
  const document = { querySelector: (selector) => current.querySelector(selector) };
  const page = { waitForFunction: async (predicate, argument, options) => {
    calls++;
    assert.equal(argument, null);
    assert.equal(options.timeout, 60_000);
    assert.equal(options.polling, 100);
    for (const state of states) {
      current = replayDom(state);
      const ready = predicate();
      observed.push(ready);
      if (ready) return;
    }
    throw new Error('synthetic_poll_not_ready');
  } };
  assert.equal(await actualReadiness(document)(page, '/replay/'), 'replay-disclosed-demo-ready');
  assert.equal(calls, 1);
  assert.deepEqual(observed, [false, false, false, true]);
});
