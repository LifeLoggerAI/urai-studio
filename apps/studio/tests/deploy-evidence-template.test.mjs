import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = resolve(process.cwd(), '..', '..');
const templatePath = resolve(repoRoot, 'docs/URAI_STUDIO_DEPLOY_EVIDENCE_TEMPLATE.md');

const requiredFragments = [
  'Commit SHA',
  'pnpm audit',
  'pnpm release:check',
  'Base URL',
  '/api/system/health',
  '/api/system/manifest',
  '/api/system/spatial-handoff',
  '/api/studio/exports',
  'integrationSummary',
  'spatialHandoff',
  'fallback-safe',
  'Remote smoke status',
];

test('deploy evidence template records required proof fields', () => {
  const template = readFileSync(templatePath, 'utf8');

  for (const fragment of requiredFragments) {
    assert.match(
      template,
      new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `deploy evidence template must include ${fragment}`,
    );
  }

  assert.match(template, /Do not mark complete unless/i);
  console.log('deploy evidence template coverage passed');
});
