import assert from 'node:assert/strict';
import fs from 'node:fs';

const rootPackage = JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));
const scripts = rootPackage.scripts ?? {};

assert.equal(scripts['done-done:guard'], 'node scripts/done-done-guard.mjs');
assert.equal(scripts['evidence:guard'], 'node scripts/evidence-schema-guard.mjs');
assert.equal(scripts['release:evidence:guard'], 'node scripts/release-evidence-boundary-guard.mjs');
assert.equal(scripts['release:evidence:source'], 'node scripts/write-source-release-evidence.mjs');
assert.equal(scripts['health:guard'], 'node scripts/health-summary-guard.mjs');
assert.equal(scripts['provider:check'], 'node scripts/provider-readiness.mjs');
assert.ok(scripts['provider:check:strict'].includes('URAI_PROVIDER_STRICT=true'));
assert.ok(scripts.audit.includes('pnpm done-done:guard'), 'audit must run the done-done guard');
assert.ok(scripts.audit.includes('pnpm evidence:guard'), 'audit must run the evidence guard');
assert.ok(scripts.audit.includes('pnpm release:evidence:guard'), 'audit must run the release evidence boundary guard');
assert.ok(scripts.audit.includes('pnpm health:guard'), 'audit must run the health guard');
assert.ok(scripts.audit.includes('pnpm provider:check'), 'source audit must report provider configuration without requiring secrets');
assert.equal(scripts.audit.includes('provider:check:strict'), false, 'source audit must remain credential-free');
assert.ok(scripts.audit.includes('pnpm lint'), 'audit must run lint');
assert.ok(scripts.audit.includes('pnpm typecheck'), 'audit must run typecheck');
assert.ok(scripts.audit.includes('pnpm test'), 'audit must run tests');
assert.ok(scripts.audit.includes('pnpm studio:smoke'), 'audit must run Studio smoke');
assert.ok(scripts['release:check'].includes('pnpm run audit'), 'release check must include audit');
assert.ok(scripts['release:check'].includes('pnpm release:evidence:guard'), 'release check must preserve the evidence boundary');
assert.ok(scripts['release:check'].includes('pnpm build'), 'release check must include the app build');
assert.ok(scripts['release:check'].includes('pnpm --dir functions build'), 'release check must include the Functions build');
assert.equal(scripts['release:check'].includes('provider:check:strict'), false, 'source release check must not imply provider proof');
assert.ok(scripts['release:check:provider'].includes('pnpm provider:check:strict'), 'provider release check must fail closed');
assert.ok(scripts['release:check:provider'].includes('pnpm release:check'), 'provider release check must include source verification');

console.log('root release scripts coverage passed');
