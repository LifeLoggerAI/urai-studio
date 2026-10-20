import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const source = readFileSync(new URL('../app/api/studio/spatial-private-media/route.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function fixture(revokeAfterDelivery = false, { kind = 'mp4', byteLength = null } = {}) {
  const original = byteLength === null
    ? Buffer.from('SYNTHETIC_AUTHORIZED_PRIVATE_MP4_BYTES')
    : Buffer.alloc(byteLength, 83)
  let deliveryReturned = false
  let passedToGuard = null
  const actor = { uid: 'synthetic-owner', tenantId: 'synthetic-tenant' }
  const app = { name: 'urai-spatial-cross-project-identity-readonly', options: { projectId: 'synthetic-spatial-project' } }
  const studioApp = { name: '[DEFAULT]', options: { projectId: 'synthetic-studio-project' } }
  const memory = { ownerUid: 'synthetic-owner', planId: 'lmp_' + 'a'.repeat(20),
    memoryId: 'memory-a', movieId: 'movie-a' }
  const asset = { kind, sha256: 'a'.repeat(64), mimeType: kind === 'mp4' ? 'video/mp4' : 'application/x-subrip',
    authorityHash: 'b'.repeat(64), expiresAt: Date.now() + 60_000, generation: '1' }
  const mocks = {
    'next/server': { NextResponse: { json: (value, options = {}) =>
      Response.json(value, { status: options.status || 200, headers: options.headers }) } },
    'firebase-admin/app': { applicationDefault: () => ({}), getApp: () => studioApp,
      getApps: () => [app], initializeApp: () => app },
    'firebase-admin/auth': { getAuth: () => ({ verifyIdToken: async () => ({ uid: actor.uid }) }) },
    'firebase-admin/firestore': { getFirestore: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => ({}) }) }) }) },
    '@/lib/firebase-admin': { adminDb: { doc: () => ({ get: async () => ({ exists: true, data: () => ({}) }) }) } },
    '@/lib/studio-life-movie-longform-auth': { requireStudioLongformAuth: async () => ({ ok: true, ...actor }),
      refreshStudioLongformAuth: async () => ({ ok: true, ...actor }) },
    '@/lib/studio-spatial-account-link': { verifyStudioSpatialAccountLink: async () => ({ spatialUid: actor.uid, revision: 1 }),
      SPATIAL_IDENTITY_PROJECT: 'synthetic-spatial-project', STUDIO_IDENTITY_PROJECT: 'synthetic-studio-project' },
    '@/lib/studio-spatial-life-movie-contract': { verifyCurrentSpatialMemoryPlan: async () => memory },
    '@/lib/studio-spatial-private-playback': {
      verifiedFinalSpatialAsset: () => asset, verifiedSegmentSpatialAsset: () => asset,
      verifiedSpatialSegmentTimeline: () => ({}), sameVerifiedSpatialSegmentTimeline: () => {},
      sameAuthorizedMemoryPlan: () => { if (deliveryReturned && revokeAfterDelivery) throw Error('synthetic_consent_revoked') },
      sameFinalSpatialAsset: () => {},
      guardedSpatialPrivateResponse: ({ bytes }) => {
        passedToGuard = bytes
        return new Response(new ReadableStream({ pull(controller) {
          const transportChunk = Uint8Array.from(bytes)
          bytes.fill(0)
          controller.enqueue(transportChunk)
          controller.close()
        } }), { status: 200 })
      },
    },
    '@/lib/studio-life-movie-longform-client': {
      callStudioLongformBridge: async () => ({ playback: { playlistDigest: 'synthetic-digest' } }),
      callStudioLongformPrivateBytes: async () => { deliveryReturned = true; return original },
    },
    '@/lib/studio-life-movie-longform-contract': {
      readStudioLongformJson: async () => ({ action: 'deliver-spatial-final',
        memoryId: memory.memoryId, movieId: memory.movieId, planId: memory.planId, kind }),
    },
  }
  const exports = {}
  new Function('exports','require','process',compiled)(exports, name => {
    assert.ok(name in mocks, 'Unexpected route import: ' + name)
    return mocks[name]
  }, { env: {
    NODE_ENV: 'test', URAI_STUDIO_SPATIAL_PRIVATE_DELIVERY_ENABLED: 'true',
    URAI_STUDIO_SPATIAL_IDENTITY_ENABLED: 'true', URAI_STUDIO_SPATIAL_MEMORY_PLAN_ENABLED: 'true',
    URAI_SPATIAL_BRIDGE_PROJECT_ID: 'synthetic-spatial-project',
  } })
  return { original, request: () => exports.POST(new Request('http://127.0.0.1:3000', { method: 'POST', body: '{}' })),
    guardedBuffer: () => passedToGuard }
}

test('successful delivery hands the original verified Buffer to the bounded scrubber, without retaining a second copy', async () => {
  const f = fixture()
  const response = await f.request()
  assert.equal(response.status, 200)
  assert.strictEqual(f.guardedBuffer(), f.original, 'route cloned and retained unzeroed private media source bytes')
  const body = Buffer.from(await response.arrayBuffer())
  assert.equal(body.toString(), 'SYNTHETIC_AUTHORIZED_PRIVATE_MP4_BYTES')
  assert.ok(f.original.every(byte => byte === 0))
})

test('consent revocation after private-byte acquisition wipes original Buffer before the denial', async () => {
  const f = fixture(true)
  const response = await f.request()
  assert.equal(response.status, 403)
  assert.equal(f.guardedBuffer(), null)
  assert.ok(f.original.every(byte => byte === 0), 'revoked private media bytes remain in route memory')
})


test('original Spatial private route enforces the 2 MiB subtitle cap independently of Jobs', async () => {
  const f = fixture(false, { kind: 'srt', byteLength: 2 * 1024 * 1024 + 1 })
  const response = await f.request()
  assert.equal(response.status, 403, 'oversized private caption must fail closed before response streaming')
  assert.equal(f.guardedBuffer(), null, 'oversized subtitle must not reach response stream')
  assert.ok(f.original.every(byte => byte === 0), 'oversized private subtitles must be scrubbed after denial')
})

test('original Spatial private route permits exactly 2 MiB captions and scrubs bytes', async () => {
  const f = fixture(false, { kind: 'srt', byteLength: 2 * 1024 * 1024 })
  const response = await f.request()
  assert.equal(response.status, 200)
  assert.strictEqual(f.guardedBuffer(), f.original)
  assert.equal((await response.arrayBuffer()).byteLength, 2 * 1024 * 1024)
  assert.ok(f.original.every(byte => byte === 0))
})

test('original Spatial private route permits MP4 exceeding the caption-specific limit', async () => {
  const f = fixture(false, { kind: 'mp4', byteLength: 2 * 1024 * 1024 + 1 })
  const response = await f.request()
  assert.equal(response.status, 200)
  assert.equal((await response.arrayBuffer()).byteLength, 2 * 1024 * 1024 + 1)
  assert.ok(f.original.every(byte => byte === 0))
})
