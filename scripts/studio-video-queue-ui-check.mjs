import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// This exercises the mounted production component with synthetic queue receipts.
// Every queue POST is intercepted locally; it creates no account, persisted job,
// provider request or private-media artifact, and conveys no release approval.
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../apps/studio/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const evidenceDir = path.resolve(process.env.URAI_QUEUE_UI_EVIDENCE_DIR || path.join(root, '_audit/20260623_urai_studio_video_factory/queue-ui'));
await fs.mkdir(evidenceDir, { recursive: true });
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
if (process.env.URAI_EXACT_HEAD) assert.equal(sourceSha, process.env.URAI_EXACT_HEAD);
const fingerprints = {};
for (const name of ['apps/studio/app/studio/video-factory/QueueReplayTeaserButton.tsx', 'scripts/studio-video-queue-ui-check.mjs', 'apps/studio/app/production-polish.css', '.github/workflows/video-factory-verification.yml']) {
  fingerprints[name] = createHash('sha256').update(await fs.readFile(path.join(root, name))).digest('hex');
}
const dirtySources = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: root, encoding: 'utf8' }).trim();
const suppliedUrl = process.env.STUDIO_QUEUE_BASE_URL;
const baseUrl = new URL(suppliedUrl || 'http://127.0.0.1:3023');
assert.equal(baseUrl.protocol, 'http:');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname), 'queue fixtures must use a local server');
let server, browser, mock;
const sockets = new Set(), mockCounts = { headers: 0, body: 0 };
const cases = [], videos = [], pageErrors = [];
const receipt = { schemaVersion: 'urai-studio-queue-ui-v1', sourceSha, fingerprints, dirtySources,
  transport: 'synthetic-local-queue-responses', providerCalls: 0, persistedJobs: 0, privateAcceptance: false,
  deploymentAcceptance: false, deviceAcceptance: false, independentApproval: false, releaseAcceptance: false, cases, videos, pageErrors };
const waitFor = async (condition, timeout = 20_000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await condition()) return; await new Promise(resolve => setTimeout(resolve, 50)); }
  throw new Error('Local fixture readiness timed out');
};
const profiles = [
  { name: 'desktop', viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' },
  { name: 'narrow-mobile', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' },
  { name: 'tablet', viewport: { width: 820, height: 1180 }, reducedMotion: 'reduce' },
  { name: 'small-mobile', viewport: { width: 360, height: 780 }, reducedMotion: 'no-preference' },
];
const fixtures = [
  { name: 'contract-only', status: 202, payload: { ok: true, status: 'firebase_admin_unconfigured', persisted: false, data: { contractOnly: true } }, expected: /No job was queued/, style: 'info' },
  { name: 'persisted', status: 200, payload: { ok: true, status: 'queued', persisted: true, data: { id: 'job_synthetic_001' } }, expected: /Queued Replay Teaser job: job_synthetic_001/, style: 'success' },
  { name: 'rejected-success-status', status: 200, payload: { ok: false, persisted: false, error: { code: 'synthetic_rejection', message: 'SYNTHETIC_INTERNAL_DETAIL' } }, expected: /incomplete queue receipt/, style: 'error' },
  { name: 'missing-job-receipt', status: 200, payload: { ok: true, status: 'queued', persisted: true }, expected: /incomplete queue receipt/, style: 'error' },
  { name: 'invalid-json', status: 200, body: '{', expected: /incomplete queue receipt/, style: 'error' },
  { name: 'signed-out', status: 401, payload: { ok: false, error: { code: 'missing_bearer_token' } }, expected: /Sign in to Studio/, style: 'error' },
  { name: 'store-unavailable', status: 503, payload: { ok: false, persisted: false }, expected: /No queued job was confirmed/, style: 'error' },
];
try {
  if (!suppliedUrl) {
    server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', baseUrl.hostname, '--port', baseUrl.port], {
      cwd: path.join(root, 'apps/studio'), stdio: ['ignore', 'pipe', 'pipe'], env: process.env,
    });
    let log = ''; server.stdout.on('data', bytes => { log += bytes; }); server.stderr.on('data', bytes => { log += bytes; });
    receipt.server = { productionBuild: true };
    await waitFor(async () => {
      if (server.exitCode !== null) throw new Error(`Studio server exited ${server.exitCode}: ${log}`);
      try { return (await fetch(new URL('/studio/video-factory/', baseUrl))).ok; } catch { return false; }
    });
  }
  mock = http.createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', baseUrl.origin);
    response.setHeader('Access-Control-Allow-Headers', 'content-type');
    response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
    if (request.url === '/headers') { mockCounts.headers++; return; }
    if (request.url === '/body') {
      mockCounts.body++; response.writeHead(200, { 'Content-Type': 'application/json' });
      response.write(JSON.stringify({ ok: true, status: 'queued', persisted: true, data: { id: 'job_synthetic_001' } }));
      return; // Intentionally never end the otherwise-valid JSON stream.
    }
    response.writeHead(404); response.end();
  });
  mock.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  await new Promise(resolve => mock.listen(0, '127.0.0.1', resolve));
  const mockOrigin = `http://127.0.0.1:${mock.address().port}`;
  const executablePath = process.env.URAI_CHROMIUM_EXECUTABLE;
  browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  receipt.browser = { version: await browser.version(), executableOverride: Boolean(executablePath), physicalDevice: false };
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: profile.viewport, reducedMotion: profile.reducedMotion,
      recordVideo: { dir: path.join(evidenceDir, 'videos'), size: profile.viewport } });
    const page = await context.newPage(); page.setDefaultTimeout(10_000); page.setDefaultNavigationTimeout(20_000);
    page.on('pageerror', error => pageErrors.push({ profile: profile.name, message: error.message }));
    let fixture, requests = 0;
    await page.route(/\/api\/studio\/video-factory\/?$/, async route => {
      requests++;
      assert.equal(route.request().method(), 'POST');
      assert.equal(route.request().postDataJSON().templateId, 'urai-replay-teaser-v1');
      if (fixture.timeout) { await route.continue({ url: `${mockOrigin}/${fixture.timeout}` }); return; }
      await route.fulfill({ status: fixture.status, contentType: 'application/json', body: fixture.body ?? JSON.stringify(fixture.payload) });
    });
    for (fixture of fixtures) {
      requests = 0;
      await page.goto(new URL('/studio/video-factory/', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
      const panel = page.locator('[data-video-factory-queue="replay-teaser"]');
      const button = panel.getByRole('button'); await waitFor(() => button.isEnabled(),10_000); await button.focus(); await page.keyboard.press('Enter');
      receipt.activeCase={profile:profile.name,name:fixture.name};
      const status = panel.getByRole('status');
      await waitFor(async () => fixture.expected.test(await status.innerText()), 10_000);
      assert.equal(requests, 1); assert.match(await panel.getAttribute('class'), new RegExp(`status-${fixture.style}`));
      assert.equal(await button.isEnabled(), true); assert.doesNotMatch(await status.innerText(), /SYNTHETIC_INTERNAL_DETAIL/);
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches }));
      if (dimensions.document > dimensions.viewport + 1) {
        receipt.failureContext = {profile:profile.name, dimensions, overflow:await page.evaluate(() => [...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,className:e.className,rect:e.getBoundingClientRect().toJSON(),scroll:e.scrollWidth,client:e.clientWidth})).filter(e=>e.rect.right>innerWidth+1).slice(0,30))};
        await page.screenshot({path:path.join(evidenceDir, `${profile.name}-overflow.png`),fullPage:true,timeout:10_000});
      }
      assert.ok(dimensions.document <= dimensions.viewport + 1, `horizontal overflow: ${profile.name}`);
      assert.equal(dimensions.reduced, profile.reducedMotion === 'reduce');
      const screenshot = `${profile.name}-${fixture.name}.png`;
      await panel.screenshot({ path: path.join(evidenceDir, screenshot), animations: 'disabled', timeout: 10_000 });
      cases.push({ profile: profile.name, name: fixture.name, requests, result: await status.innerText(), dimensions, screenshot });
    }
    await page.screenshot({ path: path.join(evidenceDir, `${profile.name}-full-route.png`), fullPage: true, animations: 'disabled', timeout: 10_000 });
    // Use native HTTP streams and virtual browser time to prove the 15s deadline
    // covers both headers and a valid JSON body that never reaches EOF.
    await page.clock.install();
    for (const timeout of ['headers', 'body']) {
      fixture = { timeout }; requests = 0;
      await page.goto(new URL('/studio/video-factory/', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
      const before = mockCounts[timeout];
      const panel = page.locator('[data-video-factory-queue="replay-teaser"]');
      await panel.getByRole('button').click();
      await waitFor(() => mockCounts[timeout] === before + 1);
      await page.clock.runFor(15_001);
      const status = panel.getByRole('status');
      await waitFor(async () => /timed out/.test(await status.innerText()), 10_000);
      assert.equal(requests, 1); assert.equal(await panel.getByRole('button').isEnabled(), true);
      const screenshot = `${profile.name}-timeout-${timeout}.png`;
      await panel.screenshot({ path: path.join(evidenceDir, screenshot), animations: 'disabled', timeout: 10_000 });
      cases.push({ profile: profile.name, name: `timeout-${timeout}`, requests, result: await status.innerText(), browserClockElapsedMs: 15_001, nativeHttpStream: true, screenshot });
      await page.clock.resume();
    }
    fixture = { ...fixtures[1] }; requests = 0;
    await page.goto(new URL('/studio/video-factory/', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    const panel = page.locator('[data-video-factory-queue="replay-teaser"]');
    await waitFor(() => panel.getByRole('button').isEnabled(),10_000);
    await panel.getByRole('button').evaluate(button => { button.click(); button.click(); });
    await waitFor(async () => /job_synthetic_001/.test(await panel.getByRole('status').innerText()), 10_000);
    assert.equal(requests, 1);
    cases.push({ profile: profile.name, name: 'rapid-double-activation', requests, result: await panel.getByRole('status').innerText() });
    const video = page.video(); await context.close(); videos.push({ profile: profile.name, path: path.relative(evidenceDir, await video.path()) });
    const serverContext=await browser.newContext({viewport:profile.viewport,javaScriptEnabled:false,reducedMotion:profile.reducedMotion});
    const serverPage=await serverContext.newPage();
    const serverResponse=await serverPage.goto(new URL('/studio/video-factory/',baseUrl).toString(),{waitUntil:'domcontentloaded',timeout:20_000});
    const serverPanel=serverPage.locator('[data-video-factory-queue="replay-teaser"]');
    assert.equal(serverResponse.status(),200);
    assert.equal(await serverPanel.getByRole('button',{includeHidden:true}).isDisabled(),true);
    const serverScreenshot=`${profile.name}-server-rendered-disabled.png`;
    const visible=await serverPanel.isVisible();
    if(visible)await serverPanel.screenshot({path:path.join(evidenceDir,serverScreenshot),animations:'disabled',timeout:10_000});
    cases.push({profile:profile.name,name:'server-rendered-action-disabled',javaScriptEnabled:false,buttonDisabled:true,visible,nativeDom:true,...(visible?{screenshot:serverScreenshot}:{})});
    await serverContext.close();
  }
  assert.equal(cases.length, 44); assert.deepEqual(pageErrors, []);
  delete receipt.activeCase; receipt.status = 'passed';
  console.log(`Studio mounted queue UI: ${cases.length} production-component cases passed across four profiles; synthetic POSTs only, zero provider calls.`);
} catch (error) {
  receipt.status = 'failed'; receipt.failure = error instanceof Error ? error.message : String(error); throw error;
} finally {
  await browser?.close(); for (const socket of sockets) socket.destroy(); mock?.close(); server?.kill('SIGTERM');
  await fs.writeFile(path.join(evidenceDir, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
}
