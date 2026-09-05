import assert from 'node:assert/strict';
import fs from 'node:fs';

const rootPackage = JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));
const scripts = rootPackage.scripts ?? {};

assert.equal(scripts['done-done:guard'], 'node scripts/done-done-guard.mjs');
assert.equal(scripts['evidence:guard'], 'node scripts/evidence-schema-guard.mjs');
assert.equal(scripts['release:evidence:contract'], 'node scripts/release-evidence-boundary-guard.mjs --contract-only');
assert.equal(scripts['release:evidence:guard'], 'node scripts/release-evidence-boundary-guard.mjs');
assert.equal(scripts['release:evidence:source'], 'node scripts/write-source-release-evidence.mjs');
assert.equal(scripts['health:guard'], 'node scripts/health-summary-guard.mjs');
assert.equal(scripts['provider:check'], 'node scripts/provider-readiness.mjs');
assert.ok(scripts['provider:check:strict'].includes('URAI_PROVIDER_STRICT=true'));
assert.ok(scripts.audit.includes('pnpm done-done:guard'), 'audit must run the done-done guard');
assert.ok(scripts.audit.includes('pnpm evidence:guard'), 'audit must run the evidence guard');
assert.ok(scripts.audit.includes('pnpm release:evidence:contract'), 'audit must run the credential-free evidence contract guard');
assert.ok(scripts.audit.includes('pnpm health:guard'), 'audit must run the health guard');
assert.ok(scripts.audit.includes('pnpm provider:check'), 'source audit must report provider configuration without requiring secrets');
assert.equal(scripts.audit.includes('provider:check:strict'), false, 'source audit must remain credential-free');
assert.ok(scripts.audit.includes('pnpm lint'), 'audit must run lint');
assert.ok(scripts.audit.includes('pnpm typecheck'), 'audit must run typecheck');
assert.ok(scripts.audit.includes('pnpm test'), 'audit must run tests');
assert.ok(scripts.audit.includes('pnpm test:membership-migration'), 'audit must run membership migration tests');
assert.ok(scripts.audit.includes('pnpm test:rules'), 'audit must run membership/rules emulator tests');
assert.ok(scripts.audit.includes('pnpm studio:smoke'), 'audit must run Studio smoke');
assert.ok(scripts['release:check'].includes('pnpm run audit'), 'release check must include audit');
assert.ok(scripts['release:check'].includes('pnpm release:evidence:contract'), 'release check must preserve the evidence contract boundary');
assert.ok(scripts['release:check'].includes('pnpm build'), 'release check must include the app build');
assert.ok(scripts['release:check'].includes('pnpm --dir functions build'), 'release check must include the Functions build');
assert.equal(scripts['release:check'].includes('provider:check:strict'), false, 'source release check must not imply provider proof');
assert.ok(scripts['release:check:provider'].includes('pnpm provider:check:strict'), 'provider release check must fail closed');
assert.ok(scripts['release:check:provider'].includes('pnpm release:check'), 'provider release check must include source verification');

const sourceEvidenceWriter = fs.readFileSync(new URL('../../../scripts/write-source-release-evidence.mjs', import.meta.url), 'utf8');
assert.ok(sourceEvidenceWriter.includes("execFileSync('git', ['rev-parse', 'HEAD']"), 'source evidence must bind to the checked-out SHA');
assert.ok(sourceEvidenceWriter.includes('spawnSync'), 'source evidence must execute its own gates');
assert.ok(sourceEvidenceWriter.includes('self_verified_gate_failed'), 'source evidence must fail closed on command failure');
assert.equal(sourceEvidenceWriter.includes('_GATE_RESULT'), false, 'caller-controlled gate outcomes must not mint pass evidence');
assert.ok(sourceEvidenceWriter.includes("['runtimeSmoke', 'bash', ['scripts/smoke.sh']"), 'source evidence must re-run runtime smoke itself');
assert.ok(sourceEvidenceWriter.includes('GITHUB_RUN_ID'), 'source evidence must retain workflow run identity when present');

console.log('root release scripts coverage passed');
