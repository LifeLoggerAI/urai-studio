import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const outputDir = path.resolve(
  repoRoot,
  process.env.URAI_CAPTURE_OUTPUT_DIR?.trim() || 'artifacts/media-master/capture-plan',
);
const planPath = path.join(outputDir, 'capture-plan.json');
const driversPath = path.resolve(
  repoRoot,
  process.env.URAI_CAPTURE_STATE_DRIVERS?.trim() ||
    'productions/media-master/capture-state-drivers.production.json',
);
const allowPartial = process.env.URAI_CAPTURE_ALLOW_PARTIAL === 'true';

function fail(message) {
  console.error(`media-master capture execute: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(planPath)) fail(`capture plan not found: ${planPath}`);
if (!fs.existsSync(driversPath)) fail(`state-driver registry not found: ${driversPath}`);

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(driversPath, 'utf8'));

if (plan.publicReleaseAuthorized !== false || plan.providerSpendAuthorized !== false) {
  fail('capture plan must remain fail-closed for public release and provider spend');
}
if (!/^[0-9a-f]{40}$/i.test(plan.exactSha || '')) fail('capture plan exact SHA is invalid');
if (registry.policy?.allowSyntheticState !== false) fail('state registry must prohibit synthetic state');
if (registry.policy?.allowDomMutation !== false) fail('state registry must prohibit DOM mutation');
if (registry.policy?.allowJavaScriptEvaluation !== false) fail('state registry must prohibit JavaScript evaluation');
if (registry.policy?.publicReleaseAuthorized !== false) fail('state registry must remain public-release disabled');

if (registry.binding?.exactSha !== plan.exactSha) {
  fail(`state-driver exact SHA does not match plan (${registry.binding?.exactSha || 'unbound'} != ${plan.exactSha})`);
}
if (registry.binding?.baseUrl !== plan.baseUrl) {
  fail(`state-driver base URL does not match plan (${registry.binding?.baseUrl || 'unbound'} != ${plan.baseUrl})`);
}
if (!registry.binding?.previewEvidence) fail('state-driver registry requires matching preview evidence');

const allowed = new Set(registry.allowedStepTypes || []);
const boundJobs = [];
const blocked = [...(plan.blocked || [])];
for (const job of plan.jobs || []) {
  const stateId = `${job.surfaceId}.${job.state}`;
  const driver = registry.drivers?.[stateId];
  if (!driver || driver.status !== 'BOUND') {
    blocked.push({ captureId: job.captureId, stateId, reason: 'state-driver-unbound' });
    continue;
  }
  for (const step of driver.steps || []) {
    if (!allowed.has(step.type)) fail(`unsupported driver step type for ${stateId}: ${step.type}`);
  }
  boundJobs.push({ job, stateId, driver });
}

if (!allowPartial && boundJobs.length !== (plan.jobs || []).length) {
  fail(`not every planned capture has a BOUND deterministic state driver (${boundJobs.length}/${(plan.jobs || []).length})`);
}
if (boundJobs.length === 0) fail('no capture jobs have BOUND deterministic state drivers');

async function runStep(page, step, stateId) {
  switch (step.type) {
    case 'click':
      if (!step.selector) fail(`click step missing selector for ${stateId}`);
      await page.locator(step.selector).click({ timeout: step.timeoutMs || 10000 });
      return;
    case 'press':
      if (!step.selector || !step.key) fail(`press step missing selector/key for ${stateId}`);
      await page.locator(step.selector).press(step.key, { timeout: step.timeoutMs || 10000 });
      return;
    case 'hover':
      if (!step.selector) fail(`hover step missing selector for ${stateId}`);
      await page.locator(step.selector).hover({ timeout: step.timeoutMs || 10000 });
      return;
    case 'waitForSelector':
      if (!step.selector) fail(`waitForSelector step missing selector for ${stateId}`);
      await page.locator(step.selector).waitFor({ state: step.state || 'visible', timeout: step.timeoutMs || 10000 });
      return;
    case 'waitForTimeout':
      if (!Number.isInteger(step.ms) || step.ms < 0 || step.ms > 10000) {
        fail(`waitForTimeout must be an integer between 0 and 10000 for ${stateId}`);
      }
      await page.waitForTimeout(step.ms);
      return;
    default:
      fail(`unhandled driver step type for ${stateId}: ${step.type}`);
  }
}

const browser = await chromium.launch({ headless: true });
const receipts = [];
try {
  for (const { job, stateId, driver } of boundJobs) {
    const context = await browser.newContext({
      viewport: { width: job.viewport.width, height: job.viewport.height },
      deviceScaleFactor: job.viewport.deviceScaleFactor || 1,
      reducedMotion: driver.reducedMotion === true ? 'reduce' : 'no-preference',
    });
    const page = await context.newPage();
    const response = await page.goto(job.routeUrl, { waitUntil: 'networkidle', timeout: 45000 });
    const status = response?.status() ?? 0;
    if (status < 200 || status >= 400) {
      await context.close();
      fail(`${job.captureId} route returned HTTP ${status}`);
    }
    for (const step of driver.steps || []) await runStep(page, step, stateId);
    if (driver.readySelector) {
      await page.locator(driver.readySelector).waitFor({ state: 'visible', timeout: driver.readyTimeoutMs || 10000 });
    }

    const artifactAbsolute = path.resolve(outputDir, job.artifactPath);
    fs.mkdirSync(path.dirname(artifactAbsolute), { recursive: true });
    await page.screenshot({ path: artifactAbsolute, fullPage: false, animations: 'disabled' });
    const bytes = fs.readFileSync(artifactAbsolute);
    if (bytes.length < 1024) {
      await context.close();
      fail(`${job.captureId} screenshot is unexpectedly small (${bytes.length} bytes)`);
    }
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    receipts.push({
      captureId: job.captureId,
      stateId,
      world: job.world,
      repository: job.repository,
      exactSha: job.exactSha,
      baseUrl: job.baseUrl,
      route: job.route,
      viewport: job.viewport,
      capturedAt: new Date().toISOString(),
      artifactPath: job.artifactPath,
      sha256,
      byteLength: bytes.length,
      driverEvidence: registry.binding.previewEvidence,
      technicalQa: 'PASS',
      visualQa: 'PENDING',
      founderApproval: 'PENDING',
      releaseAuthorization: false,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

const receipt = {
  schemaVersion: '1.0.0',
  planSha256: plan.planSha256,
  exactSha: plan.exactSha,
  baseUrl: plan.baseUrl,
  captureExecutionCompleted: receipts.length === (plan.jobs || []).length,
  partialExecution: receipts.length !== (plan.jobs || []).length,
  runtimeCertificationClaimed: false,
  founderApprovalClaimed: false,
  publicReleaseAuthorized: false,
  captures: receipts,
  blocked,
};
const receiptPath = path.join(outputDir, 'capture-receipt.execution.json');
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`media-master capture execute complete: ${receipts.length} captured; ${blocked.length} blocked; ${receiptPath}`);
