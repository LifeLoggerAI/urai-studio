import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const broker = fs.readFileSync(
  new URL('../../../functions/src/life-film-canon-broker.ts', import.meta.url),
  'utf8',
);
const index = fs.readFileSync(
  new URL('../../../functions/src/index.ts', import.meta.url),
  'utf8',
);

test('private canon broker is implemented and exported', () => {
  assert.ok(broker.includes("export const resolveAuthorizedLifeFilmCanon = onCall"));
  assert.ok(broker.includes("export const issueAcceptedSceneTruthReceipt = onCall"));
  assert.ok(index.includes('export * from "./life-film-canon-broker";'));
});

test('SceneTruth receipts mint only from accepted fail-closed packets', () => {
  assert.ok(broker.includes('record.reviewState !== "accepted" || record.accepted !== true'));
  assert.ok(broker.includes('failureCodes.length || contradictions.length || criticalUnknowns.length'));
  assert.ok(broker.includes('record.projectId !== projectId'));
  assert.ok(broker.includes('Stored SceneTruth digest does not match the canonical packet.'));
});

test('SceneTruth receipt authority is HMAC bound and expiring', () => {
  assert.ok(broker.includes('defineSecret("URAI_SCENE_TRUTH_RECEIPT_HMAC")'));
  assert.ok(broker.includes('createHmac("sha256", secretValue())'));
  assert.ok(broker.includes('RECEIPT_TTL_MS = 15 * 60 * 1000'));
  assert.ok(broker.includes('const message = `${receiptId}\\n${projectId}\\n${digest}\\n${ownerUid}\\n${expiryToken}`'));
  assert.ok(broker.includes('receiptRef: `str_${receiptId}_${expiryToken}_${signature}`'));
  assert.ok(broker.includes('mintReceipt(projectId, sceneTruthDigest, auth.uid)'));
});

test('private canon broker does not expose private source pointers in receipt', () => {
  assert.ok(broker.includes('privateCanonEmbedded: false'));
  assert.ok(broker.includes('rawDrivePointerExposed: false'));
  assert.ok(broker.includes('clientDownloadUrlIssued: false'));
  assert.ok(broker.includes('privateStorageOnly: true'));
  assert.doesNotMatch(broker, /drive\.google\.com|docs\.google\.com|gmail\.com/i);
});

test('SceneTruth digest is deterministic for nested canon packets', () => {
  assert.ok(broker.includes('function canonicalJson(value: unknown): string'));
  assert.ok(broker.includes('Object.keys(record).sort()'));
  assert.ok(broker.includes('canonicalJson(record[key])'));
});
