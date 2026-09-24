import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const routePath = path.join(root, 'apps/studio/app/readyz/route.ts');
const statusPath = path.join(root, 'apps/studio/lib/studio/status.ts');

for (const [label, file] of [
  ['readiness route', routePath],
  ['readiness status model', statusPath],
]) {
  if (!fs.existsSync(file)) throw new Error(`${label} is missing`);
}

const route = fs.readFileSync(routePath, 'utf8');
const status = fs.readFileSync(statusPath, 'utf8');

const requiredRouteTokens = [
  'type PublicReadinessCheck',
  'checks: PublicReadinessCheck[]',
  'checks: local.checks.map(({ id, required, ok: checkOk }) => ({ id, required, ok: checkOk }))',
  'integrations: profile.checks.map(({ id, configured, observed, state, httpStatus, attempts }) => ({',
  'activationAuthorized: false',
  'hardOff: profile.hardOff',
  "'Cache-Control': 'no-store, max-age=0'",
  'status: body.ok ? 200 : 503',
];
for (const token of requiredRouteTokens) {
  if (!route.includes(token)) throw new Error(`readiness redaction guard failed: ${token}`);
}

for (const forbidden of [
  'checks: readiness.checks,',
  'detail: check.detail',
  'error: check.error',
]) {
  if (route.includes(forbidden)) throw new Error(`public readiness response exposes internal detail: ${forbidden}`);
}

for (const internalMarker of ['detail: string | null', 'error?: string | null', 'firebaseProjectId', 'assetFactoryUrl']) {
  if (!status.includes(internalMarker)) throw new Error(`internal readiness diagnostics unexpectedly removed: ${internalMarker}`);
}

console.log('[urai-studio:readiness-response-redaction-guard] passed');
