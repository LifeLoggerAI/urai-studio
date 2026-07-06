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

test('Studio and membership creation are server-authorized', () => {
  const studioBlock = block(firestoreRules, 'match /studios/{studioId}');
  const membershipBlock = block(firestoreRules, 'match /memberships/{membershipDocumentId}');

  assert.match(studioBlock, /allow create: if false;/);
  assert.match(membershipBlock, /allow create, update, delete: if false;/);
  assert.doesNotMatch(membershipBlock, /allow create: if isSignedIn\(\)/);
});

test('membership authorization is bound to identity, tenant, status and role', () => {
  for (const token of [
    'data.uid == request.auth.uid',
    'data.studioId == studioId',
    'data.status == "active"',
    '["owner", "admin", "editor"]',
  ]) {
    assert.ok(firestoreRules.includes(token), `firestore.rules missing ${token}`);
  }

  assert.ok(firestoreRules.includes('request.resource.data.studioId == resource.data.studioId'));
});

test('worker-owned records cannot be written by browser clients', () => {
  for (const collection of ['jobRuns', 'outputs', 'deadLetters', 'auditLogs']) {
    const rulesBlock = block(firestoreRules, `match /${collection}/{id}`);
    assert.match(rulesBlock, /allow create, update, delete: if false;/);
  }
});

test('Storage requires active membership and prevents client output writes', () => {
  for (const token of [
    'firestore.exists(membershipPath(studioId))',
    'data.uid == request.auth.uid',
    'data.studioId == studioId',
    'data.status == "active"',
    '["owner", "admin", "editor"]',
  ]) {
    assert.ok(storageRules.includes(token), `storage.rules missing ${token}`);
  }

  const outputBlock = block(storageRules, 'match /studios/{studioId}/outputs/{allPaths=**}');
  assert.match(outputBlock, /allow write: if false;/);
});

console.log('Studio membership rule source guards passed');
