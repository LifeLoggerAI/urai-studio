#!/usr/bin/env node
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

const repoRoot = process.cwd();
const sourcePath = path.join(repoRoot, 'apps/studio/lib/studio-video-factory.ts');
const outDir = path.join(repoRoot, '_audit/20260623_urai_studio_video_factory/captures');
const motionDir = path.join(outDir, 'motion');
const baseUrl = process.env.SPATIAL_BASE_URL || process.env.HOST || 'http://127.0.0.1:3000';
const expectedSpatialSha = process.env.URAI_SPATIAL_EXPECTED_SHA?.trim() || null;
const recordSeconds = Math.max(2, Math.min(12, Number(process.env.VIDEO_FACTORY_ROUTE_RECORDING_SECONDS || 10)));

function unique(values) {
  return [...new Set(values)];
}

function fileSafe(value) {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'root';
}

function routePath(route) {
  return new URL(route, 'https://urai.invalid').pathname.replace(/\/$/, '') || '/';
}

async function waitForSemanticReady(page, route, timeoutMs = null) {
  switch (routePath(route)) {
    case '/home':
      await page.waitForFunction(() => {
        const runtimeOwner = document.querySelector('.urai-home-spatial-runtime-layer');
        if (runtimeOwner && (
          runtimeOwner.getAttribute('data-home-assets-ready') !== 'true'
          || runtimeOwner.getAttribute('data-webgl-ready') !== 'true'
          || runtimeOwner.querySelector('.home-runtime-loading')
        )) return false;
        const homeOwner = runtimeOwner || document;
        const assetOwner = homeOwner.querySelector('.urai-asset-home-world[data-home-primary-owner="asset-driven"]');
        if (assetOwner) {
          const rect = assetOwner.querySelector('canvas')?.getBoundingClientRect();
          return assetOwner.getAttribute('data-home-assets-ready') === 'true'
            && Boolean(rect && rect.width >= 240 && rect.height >= 240);
        }
        const webglOwner = homeOwner.querySelector('.urai-final-home-world[data-home-spatial-renderer="webgl"]');
        if (webglOwner) {
          const rect = webglOwner.querySelector('canvas')?.getBoundingClientRect();
          return webglOwner.getAttribute('data-home-ready') === 'true'
            && Boolean(rect && rect.width >= 240 && rect.height >= 240);
        }
        return false;
      }, null, { timeout: timeoutMs ?? 60_000, polling: 100 });
      return 'home-spatial-ready';

    case '/life-map':
      await page.waitForFunction(() => {
        const root = document.querySelector('[data-testid="urai-true-3d-life-map"]');
        const rect = root?.querySelector('canvas')?.getBoundingClientRect();
        return root?.getAttribute('data-life-map-mode') === 'overview'
          && Boolean(rect && rect.width >= 240 && rect.height >= 240);
      }, null, { timeout: timeoutMs ?? 60_000, polling: 100 });
      return 'life-map-overview-ready';

    case '/focus':
      await page.waitForFunction(() => {
        const root = document.querySelector('[data-testid="urai-final-focus-chamber"]');
        const rect = root?.querySelector('canvas')?.getBoundingClientRect();
        return root?.getAttribute('data-memory-status') === 'demo'
          && root?.getAttribute('data-memory-id') === 'demo:quiet-reset'
          && root?.getAttribute('data-manifest-id') === 'replay-recovery-thread'
          && Boolean(rect && rect.width >= 240 && rect.height >= 240);
      }, null, { timeout: timeoutMs ?? 60_000, polling: 100 });
      return 'focus-disclosed-demo-ready';

    case '/replay':
      await page.waitForFunction(() => {
        const root = document.querySelector('[data-testid="cinematic-replay-client"][data-replay-spatial-owner="r3f-immersive-memory-field"]');
        const rect = root?.querySelector('canvas')?.getBoundingClientRect();
        return root?.getAttribute('data-memory-status') === 'demo'
          && root?.getAttribute('data-memory-id') === 'demo:quiet-reset'
          && root?.getAttribute('data-manifest-id') === 'replay-recovery-thread'
          && root?.getAttribute('data-webgl-state') === 'ready'
          && root?.getAttribute('data-replay-media-status') === 'ready'
          && root?.getAttribute('data-replay-media-ready') === 'true'
          && !root.querySelector('.replaySourceStatus')
          && Boolean(rect && rect.width >= 240 && rect.height >= 240);
      }, null, { timeout: timeoutMs ?? 60_000, polling: 100 });
      return 'replay-disclosed-demo-ready';

    case '/passport':
      await page.waitForFunction(() => {
        const root = document.querySelector('main[data-route-owner="passport-ownership-vault"]');
        return root?.getAttribute('data-passport-source') === 'demo';
      }, null, { timeout: timeoutMs ?? 30_000, polling: 100 });
      return 'passport-disclosed-demo-ready';

    case '/status':
      await page.locator('[data-testid="urai-final-status-control-room"]:visible').waitFor({ state: 'visible', timeout: timeoutMs ?? 30_000 });
      return 'status-control-room-ready';

    default:
      throw new Error(`video_factory_unknown_capture_route:${route}`);
  }
}

async function assertSemanticReadyNow(page, route) {
  // Reuse the exact original route predicate, but fail on the first unready
  // observation rather than polling until a veil or media failure recovers.
  return waitForSemanticReady({
    waitForFunction: async (predicate) => {
      if (!await page.evaluate(predicate)) throw new Error(`route_lost_semantic_readiness:${route}`);
    },
    locator: (selector) => ({ waitFor: async () => {
      if (!await page.locator(selector).isVisible()) throw new Error(`route_lost_semantic_readiness:${route}`);
    } }),
  }, route);
}

async function recordSemanticReadyInterval(page, route, semanticState, seconds) {
  const started = Date.now();
  let semanticReadinessSampleCount = 0;
  let semanticStateAtRecordingEnd = null;
  do {
    semanticStateAtRecordingEnd = await assertSemanticReadyNow(page, route);
    if (semanticStateAtRecordingEnd !== semanticState) throw new Error('route_semantics_changed_during_recording');
    semanticReadinessSampleCount++;
    const remaining = seconds * 1000 - (Date.now() - started);
    if (remaining <= 0) break;
    await page.waitForTimeout(Math.min(250, remaining));
  } while (true);
  return {
    semanticStateAtRecordingEnd,
    semanticReadinessSampleCount,
    recordedReadySeconds: (Date.now() - started) / 1000,
    recordingReadinessBasis: 'continuous-immediate-semantic-polls',
  };
}

const source = await readFile(sourcePath, 'utf8');
const routes = unique([...source.matchAll(/route:\s*'([^']+)'/g)].map((match) => match[1])).filter((route) => route.startsWith('/'));

if (routes.includes('/') && routes.includes('/home')) {
  throw new Error('video_factory_duplicate_home_capture');
}

await mkdir(outDir, { recursive: true });
await mkdir(motionDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const route of routes) {
  const target = new URL(route, baseUrl).toString();
  const startedAt = new Date().toISOString();
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: motionDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  const pageVideoStartedAtMs = Date.now();
  const video = page.video();
  let responseStatus = null;
  let title = '';
  let screenshot = '';
  let motion = '';
  let semanticState = '';
  let semanticReadyOffsetSeconds = null;
  let semanticStateAtRecordingEnd = null;
  let recordedReadySeconds = null;
  let semanticReadinessSampleCount = 0;
  let recordingReadinessBasis = null;
  let deployedSha = null;
  let error = '';

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (event) => pageErrors.push(event.message));
  page.on('requestfailed', (request) => {
    requestFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`);
  });

  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    responseStatus = response?.status() ?? null;
    if (responseStatus !== null && responseStatus >= 400) throw new Error(`HTTP ${responseStatus}`);

    semanticState = await waitForSemanticReady(page, route);
    await page.waitForTimeout(750);
    semanticReadyOffsetSeconds = (Date.now() - pageVideoStartedAtMs) / 1000;
    title = await page.title().catch(() => '');
    deployedSha = await page.locator('meta[name="urai-deployed-sha"]').getAttribute('content').catch(() => null);

    if (expectedSpatialSha && deployedSha !== expectedSpatialSha) {
      throw new Error(`spatial_deploy_sha_mismatch:expected=${expectedSpatialSha}:observed=${deployedSha || 'missing'}`);
    }
    if (pageErrors.length) throw new Error(`page_errors:${pageErrors.join(' | ')}`);
    if (consoleErrors.length) throw new Error(`console_errors:${consoleErrors.join(' | ')}`);

    screenshot = path.join(outDir, `${fileSafe(route)}.png`);
    await page.screenshot({ path: screenshot, fullPage: false, animations: 'disabled', caret: 'hide' });

    // Record the actual rendered route long enough to preserve native scene motion.
    // This is diagnostic product-capture evidence only, not final Life Movie footage.
    // The native recorder's encoded timestamps need not share this process's
    // wall-clock origin. Retain the wall offset only as diagnostic metadata.
    // Preserve immediate readiness observations throughout the bounded interval;
    // any veil, decoded-media failure or source change makes capture fail.
    const recording = await recordSemanticReadyInterval(page, route, semanticState, recordSeconds);
    ({ semanticStateAtRecordingEnd, recordedReadySeconds, semanticReadinessSampleCount,
      recordingReadinessBasis } = recording);
    const finalSha = await page.locator('meta[name="urai-deployed-sha"]').getAttribute('content').catch(() => null);
    if (finalSha !== deployedSha) throw new Error('spatial_source_changed_during_recording');
    if (pageErrors.length) throw new Error(`page_errors:${pageErrors.join(' | ')}`);
    if (consoleErrors.length) throw new Error(`console_errors:${consoleErrors.join(' | ')}`);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  } finally {
    await context.close();
    if (video) {
      try {
        const temporaryVideoPath = await video.path();
        motion = path.join(motionDir, `${fileSafe(route)}.webm`);
        await copyFile(temporaryVideoPath, motion);
      } catch (videoError) {
        if (!error) error = `video_capture_failed:${videoError instanceof Error ? videoError.message : String(videoError)}`;
      }
    }
  }

  results.push({
    route,
    target,
    responseStatus,
    title,
    screenshot,
    motion,
    semanticState,
    semanticReadyOffsetSeconds,
    semanticStateAtRecordingEnd,
    recordedReadySeconds,
    semanticReadinessSampleCount,
    recordingReadinessBasis,
    deployedSha,
    expectedSpatialSha,
    consoleErrors,
    pageErrors,
    requestFailures,
    recordSeconds,
    passed: !error,
    error,
    startedAt,
    finishedAt: new Date().toISOString(),
  });
}

await browser.close();

const reportPath = path.join(outDir, 'route-capture-report.json');
const failures = results.filter((entry) => !entry.passed);
await writeFile(reportPath, JSON.stringify({
  schemaVersion: 'urai-studio-video-route-capture-2',
  ok: failures.length === 0,
  baseUrl,
  expectedSpatialSha,
  recordSeconds,
  routes,
  results,
}, null, 2) + '\n');

console.log(`Video Factory route capture report written to ${reportPath}`);
if (failures.length) {
  throw new Error(`video_factory_route_capture_failed:${failures.map((entry) => `${entry.route}=${entry.error}`).join(';')}`);
}
