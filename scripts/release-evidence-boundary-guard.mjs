#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const schema = JSON.parse(fs.readFileSync('docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json', 'utf8'));
const ledger = fs.readFileSync('docs/URAI_STUDIO_RELEASE_EVIDENCE.md', 'utf8');
const providerReadiness = fs.readFileSync('scripts/provider-readiness.mjs', 'utf8');
const artifactWriter = fs.readFileSync('scripts/studio-video-render-artifacts.mjs', 'utf8');

const scripts = packageJson.scripts ?? {};
const sourceReleaseCheck = String(scripts['release:check'] ?? '');
const providerReleaseCheck = String(scripts['release:check:provider'] ?? '');

assert.ok(sourceReleaseCheck.includes('release:evidence:guard'), 'release:check must execute the evidence boundary guard');
assert.equal(sourceReleaseCheck.includes('provider:check:strict'), false, 'source release check must remain credential-free');
assert.ok(providerReleaseCheck.includes('provider:check:strict'), 'provider release check must fail closed on missing providers');
assert.ok(providerReleaseCheck.includes('release:check'), 'provider release check must include the complete source release check');
assert.ok(providerReadiness.includes("URAI_PROVIDER_STRICT === 'true'"), 'provider readiness must keep an explicit strict mode');

for (const field of ['repository', 'commitSha', 'recordedAt', 'environment', 'gates']) {
  assert.ok(schema.required.includes(field), `release evidence schema must require ${field}`);
}

for (const gate of [
  'install',
  'lint',
  'typecheck',
  'tests',
  'appBuild',
  'functionsBuild',
  'doneDoneGuard',
  'releaseCheck',
  'providerReadiness',
  'binaryArtifacts',
  'smoke',
]) {
  assert.ok(schema.properties.gates.required.includes(gate), `release evidence schema missing required gate ${gate}`);
}

assert.ok(ledger.includes('Source-only release check'), 'release ledger must label the source-only boundary');
assert.ok(ledger.includes('Provider-backed release check'), 'release ledger must label the provider-backed boundary');
assert.ok(ledger.includes('does not prove deployment or a playable MP4'), 'release ledger must deny unsupported production claims');

for (const token of [
  'binary-render-receipt.json',
  "status: 'not-rendered'",
  'playable: false',
  'playableMp4Written: false',
]) {
  assert.ok(artifactWriter.includes(token), `artifact writer missing release-truth token ${token}`);
}

for (const forbidden of ['.mp4.placeholder', 'MP4 placeholder', 'mp4PlaceholderPath']) {
  assert.equal(artifactWriter.includes(forbidden), false, `artifact writer contains forbidden fake-binary token ${forbidden}`);
}

console.log('release evidence boundary guard passed');
