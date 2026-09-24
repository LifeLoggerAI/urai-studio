import assert from 'node:assert/strict';
import fs from 'node:fs';

const firebase = fs.readFileSync(new URL('../lib/studio/firebase.ts', import.meta.url), 'utf8');
const config = fs.readFileSync(new URL('../lib/studio/config.ts', import.meta.url), 'utf8');
const status = fs.readFileSync(new URL('../lib/studio/status.ts', import.meta.url), 'utf8');
const apphosting = fs.readFileSync(new URL('../../../apphosting.yaml', import.meta.url), 'utf8');
const envExample = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');

for (const [label, source] of [
  ['firebase diagnostics', firebase],
  ['studio config', config],
  ['readiness status', status],
]) {
  assert.ok(source.includes('GOOGLE_CLOUD_PROJECT'), `${label} must recognize GOOGLE_CLOUD_PROJECT`);
  assert.ok(source.includes('GCLOUD_PROJECT'), `${label} must recognize GCLOUD_PROJECT`);
}

assert.ok(firebase.includes("envValue('URAI_STUDIO_FIREBASE_ADMIN_ADC_VERIFIED') === '1'"), 'firebase diagnostics must bind admin availability to explicit ADC verification');
assert.ok(firebase.includes('adminAvailable: Boolean(projectId && adcVerified)'), 'firebase diagnostics must not infer admin readiness from project id alone');

assert.ok(apphosting.includes('variable: FIREBASE_PROJECT_ID'), 'App Hosting must bind the canonical Firebase project id explicitly');
assert.ok(apphosting.includes('value: urai-studio'), 'App Hosting must target the canonical urai-studio project');
assert.ok(!apphosting.includes('URAI_STUDIO_FIREBASE_ADMIN_ADC_VERIFIED'), 'App Hosting source must not pre-authorize ADC verification');

assert.ok(envExample.includes('GOOGLE_CLOUD_PROJECT / GCLOUD_PROJECT'), 'environment documentation must describe managed runtime project identity');
assert.ok(envExample.includes('URAI_STUDIO_FIREBASE_ADMIN_ADC_VERIFIED=0'), 'environment example must keep ADC verification fail-closed');

console.log('Studio managed Firebase runtime identity guard passed');
