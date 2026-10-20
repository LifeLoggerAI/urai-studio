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

function sourceHarness(payload, expectedSha) {
  const chunkCopies = []
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
  const fetchMock = async () => {
    const stream = new ReadableStream({
      start(controller) {
        const middle = Math.floor(payload.length / 2)
        controller.enqueue(Uint8Array.from(payload.subarray(0, middle)))
        controller.enqueue(Uint8Array.from(payload.subarray(middle)))
        controller.close()
      },
    })
    return new Response(stream, { status: 200, headers: {
      'content-type': 'video/mp4',
      'content-disposition': 'inline; filename="synthetic.mp4"',
      'cache-control': 'private, no-store',
      'content-length': String(payload.length),
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
    planId: 'lmp_'+'a'.repeat(20), artifact: 'final', kind: 'mp4',
    authorityHash: 'b'.repeat(64), expiresAt: Date.now() + 60_000,
    generation: '5', disposition: 'inline' }
  const expected = { sha256: expectedSha, mimeType: 'video/mp4' }
  return { run: () => sandbox.exports.callStudioLongformPrivateBytes(input, expected), chunkCopies }
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
