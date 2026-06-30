import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const testDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(testDir, '..');
const source = readFileSync(join(appRoot, 'components/studio/StudioActionPanel.tsx'), 'utf8');

assert.ok(
  source.includes("process.env.NEXT_PUBLIC_STUDIO_ADMIN_QA_ENABLED === 'true'"),
  'StudioActionPanel must be gated by NEXT_PUBLIC_STUDIO_ADMIN_QA_ENABLED',
);

assert.ok(
  source.includes('if (!qaEnabled)'),
  'StudioActionPanel must return a gated state before rendering callable buttons',
);

assert.ok(
  source.indexOf('if (!qaEnabled)') < source.indexOf('aria-label="Callable actions"'),
  'StudioActionPanel gate must appear before callable action buttons',
);

assert.ok(
  source.includes('Studio action controls are disabled for this deployment.'),
  'StudioActionPanel must show explicit gated copy when QA is disabled',
);

console.log('studio action panel gate regression passed');
