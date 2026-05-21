import assert from 'node:assert/strict';
import fs from 'node:fs';

const publicAdmin = fs.readFileSync(new URL('../app/admin/page.tsx', import.meta.url), 'utf8');
const studioAdmin = fs.readFileSync(new URL('../app/studio/admin/page.tsx', import.meta.url), 'utf8');
const appHosting = fs.readFileSync(new URL('../../../apphosting.yaml', import.meta.url), 'utf8');

for (const source of [publicAdmin, studioAdmin]) {
  assert.ok(source.includes('adminQaEnabled'), 'admin route must use admin gate helper');
  assert.ok(source.includes('NEXT_PUBLIC_STUDIO_ADMIN_QA_ENABLED'), 'admin route must read public admin gate');
  assert.ok(source.includes('STUDIO_ADMIN_QA_ENABLED'), 'admin route must support server admin gate');
}

assert.ok(publicAdmin.includes('data-urai-studio-page="admin-gated"'), '/admin must have gated public-demo state');
assert.ok(studioAdmin.includes('data-urai-studio-page="studio-admin-gated"'), '/studio/admin must have gated public-demo state');
assert.ok(appHosting.includes('NEXT_PUBLIC_STUDIO_ADMIN_QA_ENABLED'), 'App Hosting must define admin gate default');
assert.ok(appHosting.includes('value: "false"'), 'admin gate must default false in App Hosting');

console.log('admin route gate coverage passed');
