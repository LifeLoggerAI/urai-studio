import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const firestoreRules = fs.readFileSync(path.join(repoRoot, 'firestore.rules'), 'utf8');
const storageRules = fs.readFileSync(path.join(repoRoot, 'storage.rules'), 'utf8');

function block(source, matchLine) {
  const start = source.indexOf(matchLine);
  assert.notEqual(start, -1, `missing rules block: ${matchLine}`);
  const next = source.indexOf('\n    match /', start + matchLine.length);
  return source.slice(start, next === -1 ? source.length : next);
}

test('Studio and canonical membership creation are server-authorized', () => {
  const studioBlock = block(firestoreRules, 'match /studios/{studioId}');
  const canonicalBlock = block(firestoreRules, 'match /studios/{studioId}/members/{uid}');
  const legacyBlock = block(firestoreRules, 'match /memberships/{legacyMembershipId}');
  assert.match(studioBlock, /allow create, delete: if false;/);
  assert.match(canonicalBlock, /allow create, update, delete: if false;/);
  assert.match(legacyBlock, /allow read, create, update, delete: if false;/);
});

test('authorization is bound to canonical path, identity, Studio, schema, status, and role', () => {
  for (const token of ['documents/studios/$(studioId)/members/$(request.auth.uid)', 'data.uid == request.auth.uid', 'data.studioId == studioId', 'data.schemaVersion == 2', 'data.status == "active"', '["owner", "admin", "editor"]']) assert.ok(firestoreRules.includes(token), `firestore.rules missing ${token}`);
  assert.ok(firestoreRules.includes('request.resource.data.studioId == resource.data.studioId'));
});

test('worker, operation, migration, and intake records are browser-write denied', () => {
  for (const collection of ['jobs', 'jobRuns', 'outputs', 'deadLetters', 'auditLogs', 'studioOperationRequests', 'studioMembershipMigrations']) {
    const rulesBlock = block(firestoreRules, `match /${collection}/{id}`);
    assert.match(rulesBlock, /allow .*?(write|create, update, delete): if false;/s);
  }
});

test('Storage uses the same canonical active membership and denies client output writes', () => {
  for (const token of ['documents/studios/$(studioId)/members/$(request.auth.uid)', 'firestore.exists(membershipPath(studioId))', 'data.uid == request.auth.uid', 'data.studioId == studioId', 'data.schemaVersion == 2', 'data.status == "active"', '["owner", "admin", "editor"]']) assert.ok(storageRules.includes(token), `storage.rules missing ${token}`);
  assert.match(block(storageRules, 'match /studios/{studioId}/outputs/{allPaths=**}'), /allow write: if false;/);
});
