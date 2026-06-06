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
  'tenantScoped = true',
  'adFreeCoreExperience = true',
  'externalMarketingLayerEnabled = false',
];

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

const contractPath = path.join(repoRoot, 'docs/contracts/URAI_SYSTEM_CONTRACT.md');
if (existsSync(contractPath)) {
  const contract = read(contractPath);
  const missingTerms = requiredContractTerms.filter((term) => !contract.includes(term));
  if (missingTerms.length > 0) {
    fail('canonical system contract is missing required gates', missingTerms);
  }
}

const activeFiles = productionRoots.flatMap((root) => walk(path.join(repoRoot, root)));
const deprecatedImports = [];

for (const file of activeFiles) {
  const relFile = toPosix(path.relative(repoRoot, file));
  const content = read(file);
  for (const pattern of importPatterns) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      const target = match[1];
      if (deprecatedRoots.some((root) => target === root || target.startsWith(`${root}/`) || target.includes(`/${root}/`))) {
        deprecatedImports.push(`${relFile} imports ${target}`);
      }
    }
  }
}

if (deprecatedImports.length > 0) {
  fail('production code imports deprecated app roots', deprecatedImports);
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
console.log('done-done guard passed: canonical docs and contracts exist, and production imports avoid deprecated app roots.');
