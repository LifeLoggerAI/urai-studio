import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const repoRoot = join(process.cwd(), '..', '..');
const readme = await readFile(join(repoRoot, 'README.md'), 'utf8');

const requiredSnippets = [
  'docs/URAI_STUDIO_DOCS_INDEX_2026-06-16.md',
  'docs/URAI_STUDIO_REMAINING_BLOCKERS_2026-06-16.md',
  'docs/URAI_STUDIO_DEPLOY_EVIDENCE_TEMPLATE.md',
  'pnpm health:guard',
  'pnpm audit',
  'Record the output in `docs/URAI_STUDIO_RELEASE_EVIDENCE.md` and `docs/URAI_STUDIO_DEPLOY_EVIDENCE_TEMPLATE.md`',
];

const missing = requiredSnippets.filter((snippet) => !readme.includes(snippet));

if (missing.length > 0) {
  throw new Error(`README proof-path navigation is missing: ${missing.join(', ')}`);
}

console.log('README proof-path navigation checks passed');
