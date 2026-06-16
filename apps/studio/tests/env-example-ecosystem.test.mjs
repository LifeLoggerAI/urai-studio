import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = resolve(import.meta.dirname, '../../..');
const envExample = readFileSync(resolve(repoRoot, '.env.example'), 'utf8');
const integrations = readFileSync(resolve(repoRoot, 'apps/studio/lib/studio/integrations.ts'), 'utf8');

test('env example documents public ecosystem integration urls used by Studio', () => {
  const requiredPublicUrlKeys = [
    'NEXT_PUBLIC_ASSET_FACTORY_URL',
    'NEXT_PUBLIC_URAI_SPATIAL_URL',
    'NEXT_PUBLIC_URAI_JOBS_URL',
    'NEXT_PUBLIC_URAI_CONTENT_URL',
    'NEXT_PUBLIC_URAI_MARKETING_URL',
    'NEXT_PUBLIC_URAI_ANALYTICS_URL',
    'NEXT_PUBLIC_URAI_ADMIN_URL',
    'NEXT_PUBLIC_URAI_PRIVACY_URL',
    'NEXT_PUBLIC_URAI_INVESTORS_URL',
    'NEXT_PUBLIC_B2B_PORTAL_URL',
  ];

  for (const key of requiredPublicUrlKeys) {
    assert.match(envExample, new RegExp(`^${key}=`, 'm'), `.env.example is missing ${key}`);
    assert.match(
      integrations,
      new RegExp(`(?:publicUrlKey:\\s*'${key}'|integration\\([^\\n]+,\\s*'${key}')`),
      `integrations.ts is missing ${key}`,
    );
  }
});
