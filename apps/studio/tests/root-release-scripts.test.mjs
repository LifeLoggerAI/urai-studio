import assert from 'node:assert/strict';
import fs from 'node:fs';

const rootPackage = JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));
const scripts = rootPackage.scripts ?? {};

assert.equal(scripts['done-done:guard'], 'node scripts/done-done-guard.mjs');
assert.equal(scripts['evidence:guard'], 'node scripts/evidence-schema-guard.mjs');
assert.ok(scripts.audit.includes('pnpm done-done:guard'), 'audit must run the done-done guard');
assert.ok(scripts.audit.includes('pnpm evidence:guard'), 'audit must run the evidence guard');
assert.ok(scripts.audit.includes('pnpm lint'), 'audit must run lint');
assert.ok(scripts.audit.includes('pnpm typecheck'), 'audit must run typecheck');
assert.ok(scripts.audit.includes('pnpm test'), 'audit must run tests');
assert.ok(scripts.audit.includes('pnpm studio:smoke'), 'audit must run Studio smoke');
assert.ok(scripts['release:check'].includes('pnpm run audit'), 'release check must include audit');
assert.ok(scripts['release:check'].includes('pnpm build'), 'release check must include the app build');
assert.ok(scripts['release:check'].includes('pnpm --dir functions build'), 'release check must include the Functions build');

console.log('root release scripts coverage passed');
