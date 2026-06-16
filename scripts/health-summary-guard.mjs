import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const routePath = path.join(root, 'apps/studio/app/api/system/health/route.ts');

if (!fs.existsSync(routePath)) {
  throw new Error('health route is missing');
}

const src = fs.readFileSync(routePath, 'utf8');

const requiredTokens = [
  'integrationSummary',
  'configured.length',
  'missing.length',
  'requiredMissing.length',
  'requiredMissingIds',
  'integrationSummary: integrationSummary()',
];

for (const token of requiredTokens) {
  if (!src.includes(token)) {
    throw new Error(`health summary guard failed: ${token}`);
  }
}

console.log('[urai-studio:health-summary-guard] passed');
