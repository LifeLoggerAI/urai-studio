import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

const functions = fs.readFileSync(new URL('../../../functions/src/studio-system.ts', import.meta.url), 'utf8');
const entry = fs.readFileSync(new URL('../../../functions/src/index.ts', import.meta.url), 'utf8');
const firebase = JSON.parse(fs.readFileSync(new URL('../../../firebase.json', import.meta.url), 'utf8'));

function callable(name) {
  const start = functions.indexOf('export const ' + name + ' = onCall(');
  assert.ok(start >= 0, name + ' callable must remain');
  const next = functions.indexOf('export const ', start + 1);
  return functions.slice(start, next === -1 ? functions.length : next);
}
const adminGuard = functions.slice(
  functions.indexOf('async function requireCurrentStudioAdmin('),
  functions.indexOf('const STUDIO_DELETION_LEASE_FIELDS'),
);
const assetReady = callable('markAssetReady');

test('R885 retains configured Functions export and legacy Studio API compatibility', () => {
  assert.equal(firebase.functions.source, 'functions');
  assert.match(entry, /export \* from "\.\/studio-system"/);
  for (const name of ['createStudioProject', 'createAssetJob', 'createExportJob', 'getStudioDashboard']) callable(name);
});
test('R885 admin privilege requires a verified, non-revoked Firebase ID token', () => {
  assert.match(adminGuard, /verifyIdToken\(idToken, true\)/);
  assert.equal((adminGuard.match(/verifyIdToken\(idToken, true\)/g) ?? []).length, 2);
  assert.match(adminGuard, /getUser\(uid\)/);
  assert.match(adminGuard, /first\.uid !== uid \|\| second\.uid !== uid/);
});
test('R885 prevents stale or disabled privileged account admission', () => {
  assert.match(adminGuard, /account\.disabled/);
  assert.match(adminGuard, /account\.customClaims\?\.admin !== true/);
  assert.match(adminGuard, /authenticated\.auth\.token\.admin !== true/);
});
test('R885 requires current server-role from the same Firestore transaction as asset update', () => {
  assert.match(assetReady, /db\.runTransaction\(async \(transaction\) =>/);
  assert.match(assetReady, /transaction\.get\(db\.collection\("studioUsers"\)\.doc\(actorUid\)\)/);
  assert.match(assetReady, /actor\.role !== "owner" && actor\.role !== "admin"/);
  assert.match(assetReady, /actor\.disabled === true \|\| actor\.revoked === true/);
});
test('R885 rejects nonexistent or unbound assets instead of implicitly creating them', () => {
  assert.match(assetReady, /if \(!assetSnap\.exists/);
  assert.match(assetReady, /typeof ownerUid !== "string"/);
  assert.match(assetReady, /transaction\.update\(assetRef,/);
  assert.doesNotMatch(assetReady, /assetRef\.set\(/);
});
test('R885 transaction reads actor and owner deletion authority before mutation', () => {
  assert.match(assetReady, /new Set\(\[actorUid, ownerUid\]\)/);
  assert.match(assetReady, /studioDataRightsOwnerFences/);
  assert.match(assetReady, /privacyDeletionTombstones/);
  assert.match(assetReady, /fence\.active !== false \|\| fence\.permanent !== false/);
  assert.match(assetReady, /tombstone\.active !== false/);
  assert.ok(assetReady.lastIndexOf('transaction.get(') < assetReady.indexOf('transaction.update(assetRef,'));
});
test('R885 rejects deletion-planning lease even on otherwise inactive tombstone', () => {
  assert.match(assetReady, /STUDIO_DELETION_LEASE_FIELDS\.some/);
  assert.match(assetReady, /hasOwnProperty\.call\(tombstone, field\)/);
});
test('R885 maintains existing API shape and never authorizes private rendering', () => {
  assert.match(assetReady, /return \{ ok: true, assetId \}/);
  assert.doesNotMatch(assetReady, /privateRenderConsentAuthorized:\s*true/);
  assert.doesNotMatch(assetReady, /getSignedUrl\(/);
});
