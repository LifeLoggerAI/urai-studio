import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const lifecycle = fs.readFileSync(path.join(repoRoot, 'functions', 'src', 'studio-memberships.ts'), 'utf8');
const indexSource = fs.readFileSync(path.join(repoRoot, 'functions', 'src', 'index.ts'), 'utf8');

test('trusted Studio creation atomically creates canonical owner and audit evidence', () => {
  for (const token of ['export const createStudioTenant', 'collection("members")', 'role: "owner"', 'status: "active"', 'schemaVersion: MEMBERSHIP_SCHEMA_VERSION', 'action: "create_studio_tenant"', 'transaction.create(requestRef']) assert.ok(lifecycle.includes(token), `studio-memberships.ts missing ${token}`);
});

test('canonical authority never trusts legacy concatenated membership ids', () => {
  assert.ok(lifecycle.includes('function membershipRef(studioId: string, uid: string)'));
  assert.ok(lifecycle.includes('requireCanonicalMembership(actorSnapshot.data(), actorUid, studioId)'));
  assert.doesNotMatch(lifecycle, /collection\("memberships"\)/);
  assert.doesNotMatch(lifecycle, /`\$\{uid\}_\$\{studioId\}`/);
});

test('membership management is idempotent, audited, and privilege bounded', () => {
  for (const token of ['export const manageStudioMembership', 'Self-service role, status, and membership changes are not allowed.', 'Owner grants require the audited ownership-transfer operation.', 'Admins cannot grant, alter, or remove admin membership.', 'studioOperationRequests', 'requestId', 'requestFingerprint', 'requestId was already used for a different operation payload.', 'transaction.create(auditRef']) assert.ok(lifecycle.includes(token), `studio-memberships.ts missing ${token}`);
  assert.ok(lifecycle.includes('studioId, targetUid, action, requestedRole ?? "", requestedStatus ?? ""'), 'membership idempotency must bind every operation-defining input');
  assert.ok(lifecycle.includes('"transfer_studio_ownership", actorUid, studioId, targetUid'), 'ownership-transfer idempotency must bind the target owner');
});

test('ownership transfer is explicit and atomic', () => {
  for (const token of ['export const transferStudioOwnership', 'Active owner membership is required.', 'Target must be an active non-owner member.', 'role: "admin"', 'role: "owner"', 'action: "transfer_studio_ownership"']) assert.ok(lifecycle.includes(token), `studio-memberships.ts missing ${token}`);
  assert.ok(indexSource.includes('export * from "./studio-memberships";'));
});
