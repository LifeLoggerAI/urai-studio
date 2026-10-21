import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const compile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const source = file => readFileSync(new URL(file, import.meta.url), 'utf8')
const contract = {}
new Function('exports', 'require', compile(source('../lib/studio-life-movie-longform-contract.ts')))(
  contract, name => name === 'node:crypto' ? require(name) : (() => { throw new Error('Unexpected contract import: ' + name) })(),
)
const routeText = source('../app/api/studio/spatial-private-media/route.ts')
const compiled = compile(routeText)
const originalNow = Date.now

function fixture() {
  const state = { authCalls: 0, jobsCalls: 0, allowed: true, onAuth: null }
  const identity = { uid: 'synthetic-owner', tenantId: 'synthetic-tenant' }
  const studioProject = 'synthetic-studio'
  const spatialProject = 'synthetic-spatial'
  const mocks = {
    'next/server': { NextResponse: { json: (body, options = {}) => Response.json(body, options) } },
    'firebase-admin/app': {
      applicationDefault: () => ({}),
      getApp: () => ({ options: { projectId: studioProject } }),
      getApps: () => [],
      initializeApp: () => ({ options: { projectId: spatialProject } }),
    },
    'firebase-admin/auth': { getAuth: () => ({}) },
    'firebase-admin/firestore': { getFirestore: () => ({}) },
    '@/lib/firebase-admin': { adminDb: {} },
    '@/lib/studio-life-movie-longform-auth': {
      requireStudioLongformAuth: async () => {
        state.authCalls++
        await state.onAuth?.()
        return { ok: state.allowed, ...identity }
      },
      refreshStudioLongformAuth: async () => ({ ok: true, ...identity }),
    },
    '@/lib/studio-spatial-account-link': {
      verifyStudioSpatialAccountLink: async () => ({ spatialUid: identity.uid, revision: 1 }),
      SPATIAL_IDENTITY_PROJECT: spatialProject, STUDIO_IDENTITY_PROJECT: studioProject,
    },
    '@/lib/studio-spatial-life-movie-contract': { verifyCurrentSpatialMemoryPlan: async () => ({}) },
    '@/lib/studio-spatial-private-playback': {
      verifiedFinalSpatialAsset: () => ({}), verifiedSegmentSpatialAsset: () => ({}),
      verifiedSpatialSegmentTimeline: () => ({}), sameVerifiedSpatialSegmentTimeline: () => {},
      sameAuthorizedMemoryPlan: () => {}, sameFinalSpatialAsset: () => {},
      guardedSpatialPrivateResponse: () => new Response(),
    },
    '@/lib/studio-life-movie-longform-client': {
      callStudioLongformBridge: async () => { state.jobsCalls++; return { playback: {} } },
      callStudioLongformPrivateBytes: async () => { state.jobsCalls++; return Buffer.from('fixture') },
    },
    '@/lib/studio-life-movie-longform-contract': { readStudioLongformJson: contract.readStudioLongformJson },
  }
  const exports = {}
  const localProcess = { env: {
    NODE_ENV: 'test', URAI_STUDIO_SPATIAL_PRIVATE_DELIVERY_ENABLED: 'true',
    URAI_STUDIO_SPATIAL_IDENTITY_ENABLED: 'true',
    URAI_STUDIO_SPATIAL_MEMORY_PLAN_ENABLED: 'true', URAI_SPATIAL_BRIDGE_PROJECT_ID: spatialProject,
  } }
  new Function('exports', 'require', 'process', compiled)(exports, name => {
    assert.ok(Object.hasOwn(mocks, name), 'Unexpected original Studio import: ' + name)
    return mocks[name]
  }, localProcess)
  return { route: exports, state }
}

function stalledBody(signal = new AbortController().signal) {
  let finish, startedResolve
  const started = new Promise(resolve => { startedResolve = resolve })
  const stats = { cancelled: 0 }
  const stream = new ReadableStream({
    start(controller) { finish = () => { try { controller.enqueue(new TextEncoder().encode('{}')); controller.close() } catch {} } },
    pull() { startedResolve() },
    cancel() { stats.cancelled++ },
  })
  const req = new Request('https://synthetic-studio.invalid/api/studio/spatial-private-media', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: stream, duplex: 'half', signal,
  })
  return { req, stats, started, finish: () => finish?.() }
}
async function resolvedWithin(promise, ms = 350) {
  let timer
  try { return await Promise.race([
    promise.then(response => ({ response }), error => ({ error })),
    new Promise(resolve => { timer = setTimeout(() => resolve({ timedOut: true }), ms) }),
  ]) } finally { clearTimeout(timer) }
}

test('revoked Studio identity denies before reading private Spatial request body', async () => {
  const f = fixture()
  f.state.allowed = false
  const input = stalledBody()
  const result = await resolvedWithin(f.route.POST(input.req))
  assert.equal(result.response?.status, 403)
  assert.equal(f.state.jobsCalls, 0)
  input.finish()
})

test('client disconnect cancels stalled Spatial request body before Jobs is consulted', async () => {
  const f = fixture()
  const abort = new AbortController(), input = stalledBody(abort.signal)
  const pending = f.route.POST(input.req)
  try {
    await input.started
    abort.abort()
    const result = await resolvedWithin(pending)
    assert.equal(result.timedOut, undefined, 'route did not abandon a disconnected client body')
    assert.equal(result.response?.status, 403)
    assert.equal(input.stats.cancelled, 1)
    assert.equal(f.state.jobsCalls, 0)
  } finally { input.finish(); await pending }
})

test('already-aborted Spatial request refuses body read and Jobs dispatch', async () => {
  const f = fixture()
  const abort = new AbortController(); abort.abort()
  const input = stalledBody(abort.signal)
  const pending = f.route.POST(input.req)
  try {
    const result = await resolvedWithin(pending)
    assert.equal(result.timedOut, undefined)
    assert.equal(result.response?.status, 403)
    assert.equal(f.state.jobsCalls, 0)
  } finally { input.finish(); await pending }
})

test('spent original operation budget rejects before starting a stalled body read', async () => {
  const f = fixture(), start = originalNow()
  f.state.onAuth = () => { Date.now = () => start + 50_001 }
  const input = stalledBody()
  const pending = f.route.POST(input.req)
  try {
    const result = await resolvedWithin(pending)
    assert.equal(result.timedOut, undefined)
    assert.equal(result.response?.status, 403)
    assert.equal(f.state.jobsCalls, 0)
  } finally { Date.now = originalNow; input.finish(); await pending }
})

test('late authority check leaves only its remaining original request deadline for stalled input', async () => {
  const f = fixture(), start = originalNow()
  f.state.onAuth = () => { Date.now = () => start + 49_975 }
  const input = stalledBody()
  const pending = f.route.POST(input.req)
  try {
    const result = await resolvedWithin(pending, 500)
    assert.equal(result.timedOut, undefined)
    assert.equal(result.response?.status, 403)
    assert.equal(input.stats.cancelled, 1)
    assert.equal(f.state.jobsCalls, 0)
  } finally { Date.now = originalNow; input.finish(); await pending }
})
