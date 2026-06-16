#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const deprecatedRoots = ['uraistudio-app', 'app', 'studio'];
const deprecatedPathPatterns = [
  /\.bak(\.|$)/i,
  /firebase\.json\.bak/i,
  /\.ai-backups/i,
  /(^|\/)broken(\/|$)/i,
  /(^|\/)backup(\/|$)/i,
  /ship_lock/i,
  /staging_lock/i,
];

const productionRoots = [
  'apps/studio/app',
  'apps/studio/components',
  'apps/studio/lib',
  'apps/studio/src',
  'functions/src',
  'packages',
];

const requiredDocs = [
  'README.md',
  'docs/URAI_STUDIO_DONE_DONE_LOCK.md',
  'docs/contracts/URAI_SYSTEM_CONTRACT.md',
  'docs/URAI_STUDIO_SYSTEM_PIPELINES_AUDIT_2026-06-16.md',
  'docs/URAI_STUDIO_ECOSYSTEM_URL_KEYS.md',
];

const requiredRuntimeContracts = [
  'apps/studio/lib/urai-system-contract.ts',
  'apps/studio/lib/studio-spatial-handoff.ts',
];

const requiredPipelineFiles = [
  'apps/studio/lib/studio/integrations.ts',
  'apps/studio/app/api/system/spatial-handoff/route.ts',
  'functions/src/create-job.ts',
  'functions/src/job-runner.ts',
  'apps/studio/tests/studio-spatial-handoff.test.mjs',
  'apps/studio/tests/integrations.test.mjs',
  'apps/studio/tests/create-job-validation.test.mjs',
  'apps/studio/tests/job-runner-fallback.test.mjs',
];

const requiredContractTerms = [
  'StudioProject',
  'StudioBrief',
  'StudioJob',
  'StudioAsset',
  'StudioExport',
  'UraiPassport',
  'PassportPermission',
  'ConsentRequirement',
  'SafetyBoundary',
  'V1_GENESIS_HOME',
  'V2_COGNITIVE_MIRROR',
  'V3_PATTERN_REFLECTION',
  'V4_WEBXR_HANDOFF',
  'V5_MIRROR_OF_BECOMING',
  'tenantScoped',
  'adFreeCoreExperience',
  'externalMarketingLayerEnabled',
];

const requiredPipelineTerms = new Map([
  ['docs/URAI_STUDIO_SYSTEM_PIPELINES_AUDIT_2026-06-16.md', ['Jobs Pipeline', 'Content Pipeline', 'Asset Factory Pipeline', 'Spatial Pipeline', 'Analytics Pipeline', 'Marketing Pipeline', 'B2B Portal']],
  ['docs/URAI_STUDIO_ECOSYSTEM_URL_KEYS.md', ['NEXT_PUBLIC_ASSET_FACTORY_URL', 'NEXT_PUBLIC_URAI_SPATIAL_URL', 'NEXT_PUBLIC_URAI_JOBS_URL', 'NEXT_PUBLIC_URAI_CONTENT_URL', 'NEXT_PUBLIC_URAI_ANALYTICS_URL', 'NEXT_PUBLIC_B2B_PORTAL_URL']],
  ['apps/studio/lib/studio-spatial-handoff.ts', ['validateStudioSpatialManifest', 'listBlockedStudioSpatialClaims', 'DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX', 'fallback_cards']],
  ['apps/studio/lib/studio/integrations.ts', ['asset-factory', 'spatial', 'jobs', 'content', 'analytics', 'marketing', 'admin', 'privacy', 'investors', 'b2b-portal']],
  ['apps/studio/app/api/system/spatial-handoff/route.ts', ['STUDIO_SPATIAL_HANDOFF_VERSION', 'DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX', 'fallback_cards']],
  ['functions/src/create-job.ts', ['normalizeCreateJobPayload', 'allowedKinds', 'projectId', 'kind', 'priority']],
  ['functions/src/job-runner.ts', ['fallbackOutput', 'fallbackOnly: true', 'readyForExternalUse: false', 'job_succeeded_fallback']],
]);

const userFacingRoots = [
  'apps/studio/app',
  'apps/studio/components',
  'apps/studio/src/components',
];

const internalLabelPatterns = [
  /placeholder/i,
  /test mode/i,
  /debug/i,
];

const importPatterns = [
  /from\s+['"]([^'"]+)['"]/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const textExtensions = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.md', '.css', '.scss', '.html', '.yaml', '.yml'
]);

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = toPosix(path.relative(repoRoot, full));
    if (rel.startsWith('node_modules/') || rel.startsWith('.git/') || rel.startsWith('.next/')) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (textExtensions.has(path.extname(full))) {
      files.push(full);
    }
  }
  return files;
}

function walkAny(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = toPosix(path.relative(repoRoot, full));
    if (rel.startsWith('node_modules/') || rel.startsWith('.git/') || rel.startsWith('.next/')) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkAny(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function read(filePath) {
  return readFileSync(filePath, 'utf8');
}

function fail(message, details = []) {
  console.error(`done-done guard failed: ${message}`);
  for (const detail of details) console.error(` - ${detail}`);
  process.exitCode = 1;
}

for (const doc of requiredDocs) {
  if (!existsSync(path.join(repoRoot, doc))) {
    fail('required done-done documentation is missing', [doc]);
  }
}

for (const contractFile of requiredRuntimeContracts) {
  if (!existsSync(path.join(repoRoot, contractFile))) {
    fail('required runtime contract is missing', [contractFile]);
  }
}

for (const pipelineFile of requiredPipelineFiles) {
  if (!existsSync(path.join(repoRoot, pipelineFile))) {
    fail('required system pipeline guardrail is missing', [pipelineFile]);
  }
}

const contractFilesToValidate = [
  'docs/contracts/URAI_SYSTEM_CONTRACT.md',
  ...requiredRuntimeContracts,
];

for (const contractFile of contractFilesToValidate) {
  const contractPath = path.join(repoRoot, contractFile);
  if (!existsSync(contractPath)) continue;
  const contract = read(contractPath);
  const missingTerms = requiredContractTerms.filter((term) => !contract.includes(term));
  if (missingTerms.length > 0) {
    fail(`${contractFile} is missing required gates`, missingTerms);
  }
}

for (const [file, terms] of requiredPipelineTerms.entries()) {
  const filePath = path.join(repoRoot, file);
  if (!existsSync(filePath)) continue;
  const content = read(filePath);
  const missingTerms = terms.filter((term) => !content.includes(term));
  if (missingTerms.length > 0) {
    fail(`${file} is missing required pipeline guardrails`, missingTerms);
  }
}

const activeFiles = productionRoots.flatMap((root) => walk(path.join(repoRoot, root)));
const activeAnyFiles = productionRoots.flatMap((root) => walkAny(path.join(repoRoot, root)));
const deprecatedImports = [];

for (const file of activeFiles) {
  const relFile = toPosix(path.relative(repoRoot, file));
  const content = read(file);
  for (const pattern of importPatterns) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      const target = match[1];
      if (deprecatedRoots.some((root) => target === root || target.startsWith(`${root}/`) || target === `@/${root}` || target.startsWith(`@/${root}/`))) {
        deprecatedImports.push(`${relFile} imports ${target}`);
      }
    }
  }
}

if (deprecatedImports.length > 0) {
  fail('production code imports deprecated app roots', deprecatedImports);
}

const unneutralizedActiveBackups = [];
for (const file of activeAnyFiles) {
  const relFile = toPosix(path.relative(repoRoot, file));
  if (!relFile.includes('.bak')) continue;
  const content = read(file);
  if (!content.includes('Archived placeholder') || !content.includes('export {};')) {
    unneutralizedActiveBackups.push(relFile);
  }
}

if (unneutralizedActiveBackups.length > 0) {
  fail('active Studio source contains unneutralized backup artifacts', unneutralizedActiveBackups);
}

const deprecatedExisting = [];
for (const root of deprecatedRoots) {
  if (existsSync(path.join(repoRoot, root))) deprecatedExisting.push(root);
}

const deprecatedArtifacts = walk(repoRoot)
  .map((file) => toPosix(path.relative(repoRoot, file)))
  .filter((rel) => deprecatedPathPatterns.some((pattern) => pattern.test(rel)))
  .filter((rel) => !rel.startsWith('docs/'));

if (deprecatedExisting.length > 0) {
  console.warn('done-done guard warning: deprecated historical roots still exist and should be archived or removed:');
  for (const rel of deprecatedExisting) console.warn(` - ${rel}`);
}

if (deprecatedArtifacts.length > 0) {
  console.warn('done-done guard warning: deprecated artifacts still exist outside docs:');
  for (const rel of deprecatedArtifacts.slice(0, 50)) console.warn(` - ${rel}`);
  if (deprecatedArtifacts.length > 50) console.warn(` - ...and ${deprecatedArtifacts.length - 50} more`);
}

const userFacingFiles = userFacingRoots.flatMap((root) => walk(path.join(repoRoot, root)));
const internalLabels = [];

for (const file of userFacingFiles) {
  const relFile = toPosix(path.relative(repoRoot, file));
  const content = read(file);
  for (const pattern of internalLabelPatterns) {
    if (pattern.test(content)) internalLabels.push(`${relFile} matches ${pattern}`);
  }
}

if (internalLabels.length > 0) {
  fail('user-facing code contains internal placeholder/debug/test labels', internalLabels.slice(0, 50));
}

if (process.exitCode) process.exit(process.exitCode);
console.log('done-done guard passed: canonical docs, runtime contracts, and system pipeline guardrails exist.');
