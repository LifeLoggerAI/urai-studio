#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const schema = JSON.parse(fs.readFileSync('docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json', 'utf8'));
const ledger = fs.readFileSync('docs/URAI_STUDIO_RELEASE_EVIDENCE.md', 'utf8');
const providerReadiness = fs.readFileSync('scripts/provider-readiness.mjs', 'utf8');
const artifactWriter = fs.readFileSync('scripts/studio-video-render-artifacts.mjs', 'utf8');

const contractOnly = process.argv.includes('--contract-only');
const scripts = packageJson.scripts ?? {};
const sourceReleaseCheck = String(scripts['release:check'] ?? '');
const providerReleaseCheck = String(scripts['release:check:provider'] ?? '');

assert.ok(sourceReleaseCheck.includes('release:evidence:contract'), 'release:check must execute the credential-free evidence contract guard');
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

function compileJsonSchema(rootSchema) {
  function resolve(ref) {
    assert.ok(ref.startsWith('#/'), `unsupported schema reference: ${ref}`);
    return ref.slice(2).split('/').reduce((value, part) => value?.[part.replace(/~1/g, '/').replace(/~0/g, '~')], rootSchema);
  }

  function matchesType(value, type) {
    if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
    if (type === 'array') return Array.isArray(value);
    if (type === 'integer') return Number.isInteger(value);
    if (type === 'null') return value === null;
    return typeof value === type;
  }

  function visit(schemaNode, value, path, errors) {
    if (!schemaNode || typeof schemaNode !== 'object') return;
    if (schemaNode.$ref) {
      visit(resolve(schemaNode.$ref), value, path, errors);
      return;
    }
    if (schemaNode.const !== undefined && !Object.is(value, schemaNode.const)) errors.push(`${path} must equal the schema constant`);
    if (schemaNode.enum && !schemaNode.enum.some((item) => Object.is(item, value))) errors.push(`${path} is not an allowed value`);
    if (schemaNode.type && !matchesType(value, schemaNode.type)) {
      errors.push(`${path} must be ${schemaNode.type}`);
      return;
    }
    if (typeof value === 'string') {
      if (schemaNode.minLength !== undefined && value.length < schemaNode.minLength) errors.push(`${path} is too short`);
      if (schemaNode.pattern && !new RegExp(schemaNode.pattern).test(value)) errors.push(`${path} does not match the required pattern`);
      if (schemaNode.format === 'date-time' && (!Number.isFinite(Date.parse(value)) || new Date(Date.parse(value)).toISOString() !== value)) {
        errors.push(`${path} must be an exact ISO-8601 date-time`);
      }
    }
    if (typeof value === 'number' && schemaNode.minimum !== undefined && value < schemaNode.minimum) errors.push(`${path} is below the minimum`);
    if (Array.isArray(value)) {
      if (schemaNode.minItems !== undefined && value.length < schemaNode.minItems) errors.push(`${path} has too few items`);
      if (schemaNode.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) errors.push(`${path} items must be unique`);
      if (schemaNode.items) value.forEach((item, index) => visit(schemaNode.items, item, `${path}[${index}]`, errors));
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of schemaNode.required ?? []) {
        if (!Object.hasOwn(value, key)) errors.push(`${path}.${key} is required`);
      }
      if (schemaNode.additionalProperties === false && schemaNode.properties) {
        for (const key of Object.keys(value)) {
          if (!Object.hasOwn(schemaNode.properties, key)) errors.push(`${path}.${key} is not allowed`);
        }
      }
      for (const [key, childSchema] of Object.entries(schemaNode.properties ?? {})) {
        if (Object.hasOwn(value, key)) visit(childSchema, value[key], `${path}.${key}`, errors);
      }
    }
    for (const child of schemaNode.allOf ?? []) visit(child, value, path, errors);
    if (schemaNode.if) {
      const conditionErrors = [];
      visit(schemaNode.if, value, path, conditionErrors);
      visit(conditionErrors.length === 0 ? schemaNode.then : schemaNode.else, value, path, errors);
    }
  }

  return (value) => {
    const errors = [];
    visit(rootSchema, value, '$', errors);
    return errors;
  };
}

const validateReceiptSchema = compileJsonSchema(schema);

export function validateReleaseReceiptSchema(receipt) {
  const errors = validateReceiptSchema(receipt);
  assert.equal(errors.length, 0, `release evidence receipt failed JSON Schema validation:\n- ${errors.join('\n- ')}`);
}

export function validateArtifactSourceCommits(receipt) {
  if (receipt?.gates?.binaryArtifacts?.status !== 'pass') return;
  const artifacts = receipt.gates.binaryArtifacts.evidence?.artifacts;
  assert.ok(Array.isArray(artifacts) && artifacts.length > 0, 'passing binaryArtifacts evidence must contain artifacts');
  for (const artifact of artifacts) {
    assert.equal(artifact.sourceCommitSha, receipt.commitSha, `binary artifact source job SHA must equal receipt SHA for ${artifact.artifactRef ?? artifact.sourceJobId ?? 'unknown artifact'}`);
  }
}

if (!contractOnly) {
  const evidenceFile = process.env.RELEASE_EVIDENCE_FILE;
  assert.ok(evidenceFile, 'RELEASE_EVIDENCE_FILE is required when validating a release receipt');
  assert.ok(fs.existsSync(evidenceFile), `release evidence file does not exist: ${evidenceFile}`);
  const receipt = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
  validateArtifactSourceCommits(receipt);
}

console.log(contractOnly ? 'release evidence contract guard passed' : 'release evidence receipt guard passed');
