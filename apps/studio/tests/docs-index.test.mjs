import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(process.cwd(), '../..');
const indexPath = join(repoRoot, 'docs/URAI_STUDIO_DOCS_INDEX_2026-06-16.md');

assert.ok(existsSync(indexPath), 'docs index should exist');

const index = readFileSync(indexPath, 'utf8');

const requiredPaths = [
  'docs/URAI_STUDIO_FULL_AUDIT.md',
  'docs/URAI_STUDIO_SYSTEM_PIPELINES_AUDIT_2026-06-16.md',
  'docs/URAI_STUDIO_REMAINING_BLOCKERS_2026-06-16.md',
  'docs/URAI_STUDIO_HEALTH_READINESS.md',
  'docs/URAI_STUDIO_DEPLOY_EVIDENCE_TEMPLATE.md',
  'docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json',
  'apps/studio/system/urai-studio.openapi.json',
  'apps/studio/system/spatial-handoff.discovery.json',
  'apps/studio/system/spatial-handoff.openapi.json',
  'apps/studio/lib/studio-spatial-handoff.ts',
  'apps/studio/lib/studio/integrations.ts',
  'scripts/done-done-guard.mjs',
  'scripts/evidence-schema-guard.mjs',
  'scripts/health-summary-guard.mjs',
  'scripts/studio-smoke-v1.js',
  'apps/studio/tests/all.test.mjs',
  'apps/studio/tests/deploy-evidence-template.test.mjs',
  'apps/studio/tests/docs-index.test.mjs',
  'apps/studio/tests/env-example-ecosystem.test.mjs',
  'apps/studio/tests/export-handoff.test.mjs',
  'apps/studio/tests/health-summary.test.mjs',
  'apps/studio/tests/security-surface-presence.test.mjs',
  'apps/studio/tests/source-hygiene.test.mjs',
  'apps/studio/tests/spatial-handoff-discovery.test.mjs',
  'apps/studio/tests/spatial-handoff-openapi.test.mjs',
  'apps/studio/tests/system-manifest-spatial-handoff.test.mjs',
];

for (const requiredPath of requiredPaths) {
  assert.ok(index.includes(requiredPath), `docs index should reference ${requiredPath}`);
  assert.ok(existsSync(join(repoRoot, requiredPath)), `${requiredPath} should exist`);
}

assert.ok(index.includes('navigation aid'), 'index should describe its limited purpose');

console.log('docs-index: ok');
