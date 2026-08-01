import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const lifecycle = fs.readFileSync(
  path.join(repoRoot, 'functions', 'src', 'studio-memberships.ts'),
  'utf8',
);
const indexSource = fs.readFileSync(
  path.join(repoRoot, 'functions', 'src', 'index.ts'),
  'utf8',
);

test('trusted Studio creation atomically creates owner membership and audit evidence', () => {
  for (const token of [
    'export const createStudioTenant',
    'const batch = db.batch()',
    'role: "owner"',
    'status: "active"',
    'action: "create_studio_tenant"',
    'await batch.commit()',
  ]) {
    assert.ok(lifecycle.includes(token), `studio-memberships.ts missing ${token}`);
  }
});

test('membership management blocks self-service and protects privileged roles', () => {
  for (const token of [
    'export const manageStudioMembership',
    'Self-service role, status, and membership changes are not allowed.',
    'Active owner or admin membership is required.',
    'Admins cannot grant, alter, or remove owner/admin membership.',
    'Owner removal requires a separate audited ownership-transfer operation.',
    'Owner demotion or suspension requires a separate audited ownership-transfer operation.',
  ]) {
    assert.ok(lifecycle.includes(token), `studio-memberships.ts missing ${token}`);
  }
});

test('membership writes are tenant-bound and audited', () => {
  for (const token of [
    'membershipId(auth.uid, studioId)',
    'membershipId(targetUid, studioId)',
    'action: action === "remove" ? "remove_studio_membership" : "upsert_studio_membership"',
    'target: `memberships/${targetRef.id}`',
  ]) {
    assert.ok(lifecycle.includes(token), `studio-memberships.ts missing ${token}`);
  }
  assert.ok(indexSource.includes('export * from "./studio-memberships";'));
});
