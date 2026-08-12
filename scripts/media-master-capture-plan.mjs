import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const contractPath = path.join(
  repoRoot,
  'productions/media-master/product-capture.production.json',
);

function fail(message) {
  console.error(`media-master capture plan: ${message}`);
  process.exit(1);
}

const baseUrlRaw = process.env.URAI_CAPTURE_BASE_URL?.trim();
const exactSha = process.env.URAI_CAPTURE_EXACT_SHA?.trim();
const requestedWorld = process.env.URAI_CAPTURE_WORLD?.trim().toLowerCase() || null;
const outputDir = path.resolve(
  repoRoot,
  process.env.URAI_CAPTURE_OUTPUT_DIR?.trim() || 'artifacts/media-master/capture-plan',
);

if (!baseUrlRaw) fail('URAI_CAPTURE_BASE_URL is required');
if (!exactSha) fail('URAI_CAPTURE_EXACT_SHA is required');
if (!/^[0-9a-f]{40}$/i.test(exactSha)) {
  fail('URAI_CAPTURE_EXACT_SHA must be a full 40-character Git SHA');
}

let baseUrl;
try {
  baseUrl = new URL(baseUrlRaw);
} catch {
  fail('URAI_CAPTURE_BASE_URL must be a valid URL');
}
if (!['http:', 'https:'].includes(baseUrl.protocol)) {
  fail('URAI_CAPTURE_BASE_URL must use http or https');
}
baseUrl.pathname = baseUrl.pathname.replace(/\/$/, '');
baseUrl.search = '';
baseUrl.hash = '';

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
if (contract.truthBoundary.exactRuntimeShaRequired !== true) {
  fail('capture contract must require exact runtime SHA');
}
if (contract.truthBoundary.publicReleaseAuthorized !== false) {
  fail('capture contract must remain public-release disabled');
}
if (contract.truthBoundary.providerSpendAuthorized !== false) {
  fail('capture contract must remain provider-spend disabled');
}

const selected = contract.surfaces.filter((surface) => {
  if (!requestedWorld) return true;
  return (
    surface.id.toLowerCase() === requestedWorld ||
    surface.world.toLowerCase() === requestedWorld
  );
});
if (requestedWorld && selected.length === 0) {
  fail(`URAI_CAPTURE_WORLD did not match a governed surface: ${requestedWorld}`);
}

const blocked = [];
const jobs = [];
for (const surface of selected) {
  if (!surface.route) {
    blocked.push({
      surfaceId: surface.id,
      world: surface.world,
      reason: surface.requiresDeviceSpecificAuthority
        ? 'device-specific-authority-required'
        : 'canonical-route-unresolved',
    });
    continue;
  }

  for (const state of surface.captureStates) {
    for (const derivative of contract.derivatives) {
      const captureId = [surface.id, state, derivative.id, exactSha.slice(0, 12)].join('--');
      const routeUrl = new URL(surface.route, `${baseUrl.href}/`).href;
      const artifactPath = path.posix.join(
        'captures',
        exactSha,
        surface.id,
        state,
        `${derivative.id}.png`,
      );
      jobs.push({
        captureId,
        surfaceId: surface.id,
        world: surface.world,
        priority: surface.priority,
        state,
        derivativeId: derivative.id,
        repository: contract.authority.canonicalRuntimeRepository,
        exactSha,
        baseUrl: baseUrl.href,
        route: surface.route,
        routeUrl,
        viewport: {
          width: derivative.width,
          height: derivative.height,
          deviceScaleFactor: contract.masterProfile.deviceScaleFactor,
        },
        artifactPath,
        textlessPreferred: contract.masterProfile.textlessPreferred,
        technicalQa: 'PENDING',
        visualQa: 'PENDING',
        founderApproval: 'PENDING',
        releaseAuthorization: false,
      });
    }
  }
}

const planCore = {
  schemaVersion: '1.0.0',
  projectId: contract.projectId,
  generatedAt: new Date().toISOString(),
  sourceContract: path.relative(repoRoot, contractPath),
  repository: contract.authority.canonicalRuntimeRepository,
  exactSha,
  baseUrl: baseUrl.href,
  requestedWorld,
  publicReleaseAuthorized: false,
  providerSpendAuthorized: false,
  jobs,
  blocked,
};
const digest = crypto
  .createHash('sha256')
  .update(JSON.stringify({ ...planCore, generatedAt: null }))
  .digest('hex');
const plan = { ...planCore, planSha256: digest };

fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'capture-plan.json');
fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`);

const receiptTemplate = {
  schemaVersion: '1.0.0',
  planSha256: digest,
  exactSha,
  captureExecutionCompleted: false,
  runtimeCertificationClaimed: false,
  founderApprovalClaimed: false,
  publicReleaseAuthorized: false,
  captures: jobs.map((job) => ({
    captureId: job.captureId,
    world: job.world,
    repository: job.repository,
    exactSha: job.exactSha,
    baseUrl: job.baseUrl,
    route: job.route,
    viewport: job.viewport,
    capturedAt: null,
    artifactPath: job.artifactPath,
    sha256: null,
    technicalQa: 'PENDING',
    visualQa: 'PENDING',
    founderApproval: 'PENDING',
    releaseAuthorization: false,
  })),
  blocked,
};
fs.writeFileSync(
  path.join(outputDir, 'capture-receipt.template.json'),
  `${JSON.stringify(receiptTemplate, null, 2)}\n`,
);

console.log(
  `media-master capture plan ready: ${jobs.length} capture jobs; ${blocked.length} blocked surfaces; ${outputPath}`,
);
