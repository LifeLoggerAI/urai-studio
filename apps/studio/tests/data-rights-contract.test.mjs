import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../functions/src/data-rights.ts', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../../functions/src/index.ts', import.meta.url), 'utf8');
const rules = fs.readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');

test('Studio data-rights source contract is explicit and production execution is not claimed', () => {
  assert.match(source, /STUDIO_DATA_RIGHTS_SOURCE_CONTRACT/);
  assert.match(source, /schemaVersion: DATA_RIGHTS_SCHEMA_VERSION/);
  assert.match(source, /productionExecutionClaimed: false/);
  assert.match(source, /firebaseAuthDeletionOwnedBy: "central-privacy"/);
});

test('Studio export packages are private checksum-bound records', () => {
  assert.match(source, /private\/data-rights\/studio/);
  assert.match(source, /cacheControl: "private, no-store, max-age=0"/);
  assert.match(source, /checksum = sha256\(body\)/);
  assert.match(source, /getStudioDataExportDownload/);
  assert.match(source, /expiresAtMs = Date\.now\(\) \+ 5 \* 60 \* 1000/);
});

test('Studio deletion requires restore window, verified backup, admin authority, and legal-hold clearance', () => {
  assert.match(source, /RESTORE_WINDOW_MS = 7 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(source, /PURGE_TARGET_MS = 30 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(source, /executeStudioDataDeletion = onCall/);
  assert.match(source, /const actor = requireAdmin\(request\)/);
  assert.match(source, /Deletion restore window is still active/);
  assert.match(source, /blocked by an active legal hold/);
  assert.match(source, /assertVerifiedPackage/);
  assert.match(source, /purgeReceipt/);
});

test('Studio owner cancellation remains available only inside the restore window', () => {
  assert.match(source, /cancelStudioDataDeletion = onCall/);
  assert.match(source, /Deletion restore window has expired/);
  assert.match(source, /status: "cancelled"/);
});

test('Studio data-rights callables are exported and control-plane collections deny client SDK access', () => {
  assert.match(index, /export \* from "\.\/data-rights"/);
  assert.match(rules, /match \/studioDataRightsRequests\/\{id\} \{\s*allow read, write: if false;/);
  assert.match(rules, /match \/studioDataRightsAudit\/\{id\} \{\s*allow read, write: if false;/);
});
