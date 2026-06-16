import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../lib/studio/integrations.ts', import.meta.url), 'utf8');

const required = [
  'asset-factory',
  'spatial',
  'jobs',
  'content',
  'analytics',
  'marketing',
  'admin',
  'privacy',
  'investors',
  'b2b-portal',
];

for (const id of required) {
  assert.ok(src.includes(`'${id}'`) || src.includes(`"${id}"`), `missing integration diagnostic: ${id}`);
}

const requiredEnvKeys = [
  'NEXT_PUBLIC_ASSET_FACTORY_URL',
  'NEXT_PUBLIC_URAI_SPATIAL_URL',
  'NEXT_PUBLIC_URAI_JOBS_URL',
  'NEXT_PUBLIC_URAI_CONTENT_URL',
  'NEXT_PUBLIC_URAI_ANALYTICS_URL',
  'NEXT_PUBLIC_URAI_MARKETING_URL',
  'NEXT_PUBLIC_URAI_ADMIN_URL',
  'NEXT_PUBLIC_URAI_PRIVACY_URL',
  'NEXT_PUBLIC_URAI_INVESTORS_URL',
  'NEXT_PUBLIC_B2B_PORTAL_URL',
];

for (const key of requiredEnvKeys) {
  assert.ok(src.includes(key), `missing integration env key: ${key}`);
}

console.log('ecosystem integration diagnostics coverage passed');
