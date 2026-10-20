import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const source = readFileSync(new URL('../lib/studio-life-movie-longform-client.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

class SyntheticBridgeError extends Error {
  constructor(code, status) { super(code); this.status = status }
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

function sourceHarness(payload, expectedSha, kind = 'mp4', options = {}) {
  const chunkCopies = []
  const transport = { fetchCalls: 0, cancels: 0, observedAborted: [] }
  const trackedBuffer = new Proxy(Buffer, {
    get(target, name) {
      if (name === 'from') return (...args) => {
        const chunk = Buffer.from(...args)
        chunkCopies.push(chunk)
        return chunk
      }
      return Reflect.get(target, name, target)
    },
  })
  const fetchMock = async (_url, fetchOptions) => {
    transport.fetchCalls++
    transport.observedAborted.push(fetchOptions.signal.aborted)
    const stream = new ReadableStream({
      start(controller) {
        const middle = Math.floor(payload.length / 2)
        controller.enqueue(Uint8Array.from(payload.subarray(0, middle)))
        controller.enqueue(Uint8Array.from(payload.subarray(middle)))
        if (!options.keepStreamOpen) controller.close()
      },
      cancel() { transport.cancels++ },
    })
    return new Response(stream, { status: 200, headers: {
      'content-type': kind === 'mp4' ? 'video/mp4' : 'application/x-subrip',
      'content-disposition': 'inline; filename="synthetic.mp4"',
      'cache-control': 'private, no-store',
      ...(options.omitContentLength ? {} : { 'content-length': String(options.advertisedLength ?? payload.length) }),
    } })
  }
  const sandbox = { exports: {} }
  const importer = name => {
    if (name === 'server-only') return {}
    if (name === 'node:crypto') return require(name)
    if (name === './studio-life-movie-longform-contract') return {
      StudioLongformError: SyntheticBridgeError,
      readStudioLongformJson: async () => ({}),
      STUDIO_LONGFORM_JOBS_CONTRACT: { maxRequestBytes: 4096 },
    }
    throw new Error('Unexpected original source import: ' + name)
  }
  const env = { ...process.env,
    NODE_ENV: 'test', URAI_STUDIO_LONGFORM_DISPATCH_ENABLED: 'true',
    URAI_JOBS_LONGFORM_BRIDGE_URL: 'http://127.0.0.1:55599',
    URAI_STUDIO_JOBS_BRIDGE_TOKEN: 'synthetic-test-token',
  }
  new Function('exports', 'require', 'fetch', 'Buffer', 'process', compiled)(
    sandbox.exports, importer, fetchMock, trackedBuffer, { env },
  )
  const input = { action: 'deliver', tenantId: 'synthetic-tenant', userId: 'synthetic-owner',
    planId: 'lmp_'+'a'.repeat(20), artifact: 'final', kind,
    authorityHash: 'b'.repeat(64), expiresAt: Date.now() + 60_000,
    generation: '5', disposition: 'inline' }
  const expected = { sha256: expectedSha, mimeType: kind === 'mp4' ? 'video/mp4' : 'application/x-subrip', ...(options.signal ? { signal: options.signal } : {}) }
  return { run: () => sandbox.exports.callStudioLongformPrivateBytes(input, expected), chunkCopies, transport }
}

test('verified private delivery scrubs scratch chunks without corrupting returned authorized bytes', async () => {
  const original = Buffer.from('SYNTHETIC_MP4_BYTES_FOR_GUARD_TEST')
  const harness = sourceHarness(original, sha256(original))
  const delivered = await harness.run()
  assert.deepEqual(delivered, original)
  assert.equal(harness.chunkCopies.length, 2)
  for (const scratch of harness.chunkCopies) {
    assert.ok(scratch.every(byte => byte === 0), 'original Jobs bridge retained authenticated private chunk scratch')
  }
})

test('mismatched private bytes scrub scratch chunks on digest rejection', async () => {
  const original = Buffer.from('SYNTHETIC_HASH_MISMATCH_BYTES')
  const harness = sourceHarness(original, '0'.repeat(64))
  await assert.rejects(harness.run(), /longform_private_media_hash_mismatch/)
  assert.equal(harness.chunkCopies.length, 2)
  for (const scratch of harness.chunkCopies) {
    assert.ok(scratch.every(byte => byte === 0), 'original Jobs bridge retained rejected private chunk scratch')
  }
})


test('protected subtitle delivery accepts the exact 2 MiB cross-system browser ceiling', async () => {
  const source = Buffer.alloc(2 * 1024 * 1024, 65)
  const harness = sourceHarness(source, sha256(source), 'srt')
  const delivered = await harness.run()
  assert.deepEqual(delivered, source)
  assert.ok(harness.chunkCopies.every(chunk => chunk.every(byte => byte === 0)))
})

test('protected subtitles exceeding the original Spatial 2 MiB ceiling never cross the Studio bridge', async () => {
  const source = Buffer.alloc(2 * 1024 * 1024 + 1, 66)
  const harness = sourceHarness(source, sha256(source), 'srt')
  await assert.rejects(harness.run(), /longform_private_media_too_large/)
  assert.ok(harness.chunkCopies.every(chunk => chunk.every(byte => byte === 0)))
  assert.ok(harness.transport.cancels > 0, 'oversized media response stream was not cancelled')
})

test('verified video may exceed the subtitle-specific ceiling', async () => {
  const source = Buffer.alloc(2 * 1024 * 1024 + 1, 67)
  const harness = sourceHarness(source, sha256(source), 'mp4')
  const delivered = await harness.run()
  assert.deepEqual(delivered, source)
})

test('an already-aborted private request never initiates a Jobs network dispatch', async () => {
  const aborted = new AbortController()
  aborted.abort()
  const source = Buffer.from('SYNTHETIC_POST_LOGOUT_MEDIA')
  const harness = sourceHarness(source, sha256(source), 'mp4', { signal: aborted.signal })
  await assert.rejects(harness.run())
  assert.equal(harness.transport.fetchCalls, 0)
})

test('unadvertised subtitle overflow is stopped during streaming without retaining private bytes', async () => {
  const source = Buffer.alloc(2 * 1024 * 1024 + 1, 68)
  const harness = sourceHarness(source, sha256(source), 'srt', { omitContentLength: true, keepStreamOpen: true })
  await assert.rejects(harness.run(), /longform_private_media_too_large/)
  assert.ok(harness.chunkCopies.every(chunk => chunk.every(byte => 0 === byte)))
  assert.ok(harness.transport.cancels > 0)
})
