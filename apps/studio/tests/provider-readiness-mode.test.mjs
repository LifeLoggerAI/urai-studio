import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../../../scripts/provider-readiness.mjs', import.meta.url));
const keys = [
  'URAI_ASSET_FACTORY_BASE_URL', 'URAI_SPATIAL_BASE_URL',
  'URAI_ANALYTICS_BASE_URL', 'URAI_CONTENT_BASE_URL',
  'URAI_GENERATION_PROVIDER', 'URAI_GENERATION_API_KEY', 'URAI_PROVIDER_STRICT',
];
const cleanEnv = { ...process.env };
for (const key of keys) delete cleanEnv[key];

const valid = {
  URAI_ASSET_FACTORY_BASE_URL: 'https://assets.urailabs.com',
  URAI_SPATIAL_BASE_URL: 'https://urai.app',
  URAI_ANALYTICS_BASE_URL: 'https://uraianalytics.com',
  URAI_CONTENT_BASE_URL: 'https://uraicontent.com',
  URAI_GENERATION_PROVIDER: 'runway',
  URAI_GENERATION_API_KEY: 'private-provider-canary-sentinel',
};
function run(overrides = {}) {
  const result = spawnSync(process.execPath, [script], {
    env: { ...cleanEnv, ...overrides },
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null, 'configuration check must terminate');
  return { ...result, payload: JSON.parse(result.stdout) };
}

const unconfigured = run();
assert.equal(unconfigured.status, 0, 'optional local check tolerates missing configuration');
assert.equal(unconfigured.payload.notConfigured.length, 5);
assert.equal(unconfigured.payload.configurationReady, false);

const missingStrict = run({ URAI_PROVIDER_STRICT: 'true' });
assert.equal(missingStrict.status, 1, 'strict configuration must fail on missing values');
assert.equal(missingStrict.payload.blocked.length, 5);

const configured = run({ ...valid, URAI_PROVIDER_STRICT: 'true' });
assert.equal(configured.status, 0);
assert.equal(configured.payload.configurationReady, true);
assert.equal(configured.payload.configured.length, 5);
assert.equal(configured.payload.evidenceScope, 'configuration-only');
assert.deepEqual(configured.payload.ready, [], 'environment presence must not certify provider readiness');
assert.equal(configured.payload.providerRuntimeVerified, false);
assert.equal(configured.payload.releaseReady, false);
assert.ok(configured.payload.providers.every((row) => row.status === 'configured' && row.runtimeVerified === false));
assert.ok(!configured.stdout.includes(valid.URAI_GENERATION_API_KEY), 'diagnostics must never echo credentials');

const whitespace = run({ ...valid, URAI_PROVIDER_STRICT: 'true', URAI_GENERATION_API_KEY: '   ' });
assert.equal(whitespace.status, 1, 'whitespace credentials are absent');
assert.deepEqual(whitespace.payload.blocked[0].missing, ['URAI_GENERATION_API_KEY']);

for (const endpoint of [
  'not-a-url', 'http://assets.urailabs.com', 'https://localhost',
  'https://127.0.0.1', 'https://[::1]', 'https://private.internal',
  'https://example.com', 'https://user:secret@assets.urailabs.com',
  'https://assets.urailabs.com?token=secret', 'https://assets.urailabs.com#secret',
]) {
  const rejected = run({ ...valid, URAI_PROVIDER_STRICT: 'true', URAI_ASSET_FACTORY_BASE_URL: endpoint });
  assert.equal(rejected.status, 1, 'strict config must reject invalid or unsafe endpoint: ' + endpoint);
  assert.equal(rejected.payload.blocked[0].invalid[0].key, 'URAI_ASSET_FACTORY_BASE_URL');
  assert.ok(!rejected.stdout.includes(endpoint), 'invalid endpoint values are not retained');
}

const invalidOptional = run({ ...valid, URAI_ASSET_FACTORY_BASE_URL: 'http://assets.urailabs.com' });
assert.equal(invalidOptional.status, 0);
assert.equal(invalidOptional.payload.invalidConfiguration.length, 1);
assert.equal(invalidOptional.payload.configurationReady, false);

for (const identity of ['local-proof', 'fallback', 'mock', 'test', 'placeholder', 'Unnamed Provider']) {
  const rejected = run({ ...valid, URAI_PROVIDER_STRICT: 'true', URAI_GENERATION_PROVIDER: identity });
  assert.equal(rejected.status, 1, 'local or unnamed generation identity cannot pass external configuration');
  assert.equal(rejected.payload.blocked[0].invalid[0].key, 'URAI_GENERATION_PROVIDER');
}

console.log('provider readiness configuration behavior regression passed');
