import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const routePath = path.join(root, 'apps/studio/app/api/system/health/route.ts');
const testPath = path.join(root, 'apps/studio/tests/health-summary.test.mjs');

for (const [label, file] of [
  ['health route', routePath],
  ['health summary test', testPath],
]) {
  if (!fs.existsSync(file)) {
    throw new Error(`${label} is missing`);
  }
}

const routeSrc = fs.readFileSync(routePath, 'utf8');
const testSrc = fs.readFileSync(testPath, 'utf8');

const routeTokens = [
  'integrationSummary',
  'configured.length',
  'missing.length',
  'requiredMissing.length',
  'requiredMissingIds',
  'integrationSummary: integrationSummary()',
];

for (const token of routeTokens) {
  if (!routeSrc.includes(token)) {
    throw new Error(`health summary guard failed: ${token}`);
  }
}

const testTokens = [
  'integrationSummary',
  'requiredMissingIds:',
  'health summary response coverage passed',
];

for (const token of testTokens) {
  if (!testSrc.includes(token)) {
    throw new Error(`health summary test guard failed: ${token}`);
  }
}

console.log('[urai-studio:health-summary-guard] passed');
