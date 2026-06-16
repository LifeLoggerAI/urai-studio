import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../app/api/system/health/route.ts', import.meta.url), 'utf8');

const requiredTokens = [
  'integrationSummary',
  'total:',
  'configured:',
  'missing:',
  'requiredMissing:',
  'requiredMissingIds:',
  'studioIntegrations',
  'configuredIntegrations',
  'missingIntegrations',
  'requiredMissingIntegrations',
];

for (const token of requiredTokens) {
  assert.ok(src.includes(token), `missing health summary token: ${token}`);
}

assert.ok(
  src.indexOf('integrationSummary') > src.indexOf('requiredMissingIntegrations'),
  'summary must be derived after integration groups are computed',
);

console.log('health summary response coverage passed');
