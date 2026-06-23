#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

const repoRoot = process.cwd();
const sourcePath = path.join(repoRoot, 'apps/studio/lib/studio-video-factory.ts');
const outDir = path.join(repoRoot, '_audit/20260623_urai_studio_video_factory/captures');
const baseUrl = process.env.SPATIAL_BASE_URL || process.env.HOST || 'http://127.0.0.1:3000';

function unique(values) {
  return [...new Set(values)];
}

function fileSafe(value) {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'root';
}

const source = await readFile(sourcePath, 'utf8');
const routes = unique([...source.matchAll(/route:\s*'([^']+)'/g)].map((match) => match[1])).filter((route) => route.startsWith('/'));

if (routes.includes('/') && routes.includes('/home')) {
  throw new Error('video_factory_duplicate_home_capture');
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const results = [];

for (const route of routes) {
  const target = new URL(route, baseUrl).toString();
  const startedAt = new Date().toISOString();
  let status = 'unknown';
  let title = '';
  let screenshot = '';

  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
    status = String(response?.status() ?? 'no-response');
    title = await page.title().catch(() => '');
    screenshot = path.join(outDir, `${fileSafe(route)}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
  } catch (error) {
    status = `error:${error instanceof Error ? error.message : 'unknown'}`;
  }

  results.push({ route, target, status, title, screenshot, startedAt, finishedAt: new Date().toISOString() });
}

await browser.close();

const reportPath = path.join(outDir, 'route-capture-report.json');
await writeFile(reportPath, JSON.stringify({ ok: true, baseUrl, routes, results }, null, 2));

console.log(`Video Factory route capture report written to ${reportPath}`);
