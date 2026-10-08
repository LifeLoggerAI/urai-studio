import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { Writable } from 'node:stream';
const require = createRequire(new URL('../../../functions/package.json', import.meta.url));
const ts = require('typescript'), uid = 'synthetic-owner', projectId = 'demo-urai-studio';
const source = fs.readFileSync(process.env.STUDIO_DELETION_SOURCE || new URL('../../../functions/src/data-rights.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
class Response extends Writable {
  constructor(onChunk) { super(); this.chunks = []; this.headers = {}; this.statusCode = 200; this.headersSent = false; this.onChunk = onChunk; this.on('error', () => {}); }
  set(key, value) { if (typeof key === 'object') Object.assign(this.headers, key); else this.headers[key] = value; return this; }
  status(code) { this.statusCode = code; return this; }
  json(value) { this.body = value; return this; }
  _write(chunk, _encoding, callback) { this.headersSent = true; this.chunks.push(Buffer.from(chunk)); this.onChunk?.(this.chunks.length); callback(); }
}
function harness() {
  const documents = new Map(), objects = new Map(), state = { now: Date.now(), sequence: 0, revoked: false, signs: 0, onDownload: null, onSave: null, onTransaction: null, onBeforeTransactionCommit: null, onTransactionRead: null, adminRole: true, disabled: false, verifyCalls: 0, firestoreReads: 0, storageReads: 0, maxWrites: 0 };
  class FixtureDate extends Date { constructor(...args) { super(...(args.length ? args : [state.now])); } static now() { return state.now; } }
  const fieldDelete = '__DELETE__', fieldServer = '__TIMESTAMP__';
  function patch(path, value, merge) { const out = merge ? structuredClone(documents.get(path) || {}) : {};
    for (const [key, entry] of Object.entries(value)) { if (entry === fieldDelete) delete out[key]; else out[key] = entry === fieldServer ? new Date(state.now).toISOString() : structuredClone(entry); }
    documents.set(path, out); }
  const versions = new Map(); let clock = 0;
  function version(path) { const fingerprint = JSON.stringify(documents.get(path));
    const before = versions.get(path); if (!before || before.fingerprint !== fingerprint) versions.set(path, { fingerprint, clock: ++clock });
    const stamp = versions.get(path).clock; return { seconds: stamp, nanoseconds: 0, isEqual: other => other?.seconds === stamp && other?.nanoseconds === 0 }; }
  const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, sorted(entry)])) : value;
  const snapshot = ref => { const value = sorted(structuredClone(documents.get(ref.path)));
    return { ref, id: ref.id, exists: documents.has(ref.path), updateTime: version(ref.path), data: () => structuredClone(value) }; };
  const reference = path => ({ path, id: path.split('/').at(-1), get: async () => snapshot(reference(path)),
    set: async (value, options) => patch(path, value, options?.merge), collection: child => collection(`${path}/${child}`) });
  function collection(name) { const filters = []; let max = Infinity, cursor = null;
    const capture = () => { const docs = [...documents].filter(([key, value]) => key.startsWith(`${name}/`) && key.split('/').length === name.split('/').length + 1
        && (!cursor || key.split('/').at(-1) > cursor) && filters.every(([field, op, expected]) => op === '==' && value[field] === expected)).sort(([a], [b]) => a.localeCompare(b)).slice(0, max).map(([key]) => snapshot(reference(key))); return { docs, size: docs.length }; };
    const query = { path: name, capture, doc: id => reference(`${name}/${id || `synthetic_request_${++state.sequence}`}`),
      where(field, op, value) { filters.push([field, op, value]); return this; }, orderBy() { return this; }, limit(value) { max = value; return this; }, startAfter(value) { cursor = value?.id ?? value; return this; },
      async get() { const docs = [...documents].filter(([key, value]) => key.startsWith(`${name}/`) && key.split('/').length === name.split('/').length + 1
        && (!cursor || key.split('/').at(-1) > cursor) && filters.every(([field, op, expected]) => op === '==' && value[field] === expected)).sort(([a], [b]) => a.localeCompare(b)).slice(0, max).map(([key]) => snapshot(reference(key)));
        return { docs, size: docs.length }; } };
    return query;
  }
  const db = { collection, doc: reference, async runTransaction(callback) { const writes = [], reads = new Map(), queries = new Map();
    const tx = { get: async ref => { state.firestoreReads++; if (ref.capture) { const result = ref.capture(); queries.set(ref, JSON.stringify(result.docs.map(doc => [doc.ref.path, doc.updateTime.seconds, doc.updateTime.nanoseconds]))); return result; } const result = snapshot(ref); reads.set(ref.path, result.updateTime);
        await state.onTransactionRead?.(ref.path); return result; },
      getAll: async (...refs) => Promise.all(refs.map(ref => tx.get(ref))),
      delete: (ref, precondition) => writes.push(() => { if (precondition?.lastUpdateTime) assert.equal(precondition.lastUpdateTime.isEqual(version(ref.path)), true); documents.delete(ref.path); }), create: (ref, value) => writes.push(() => { assert.equal(documents.has(ref.path), false); patch(ref.path, value, false); }),
      set: (ref, value, options) => writes.push(() => patch(ref.path, value, options?.merge)), update: (ref, value) => writes.push(() => patch(ref.path, value, true)) };
    const result = await callback(tx); await state.onBeforeTransactionCommit?.(reads, writes);
    for (const [query, original] of queries) if (JSON.stringify(query.capture().docs.map(doc => [doc.ref.path, doc.updateTime.seconds, doc.updateTime.nanoseconds])) !== original) throw Object.assign(new Error('synthetic transaction query conflict'), { code: 'aborted' });
    for (const [path, stamp] of reads) if (!stamp.isEqual(version(path))) throw Object.assign(new Error('synthetic transaction read conflict'), { code: 'aborted' });
    state.maxWrites = Math.max(state.maxWrites, writes.length); assert.ok(writes.length <= 450);
    for (const write of writes) write(); await state.onTransaction?.(); return result; }, batch() {
      const writes = []; return { delete: ref => writes.push(() => documents.delete(ref.path)),
        set: (ref, value) => writes.push(() => patch(ref.path, value, false)), async commit() { for (const write of writes) write(); } };
    } };
  const firestore = Object.assign(() => db, { FieldValue: { delete: () => fieldDelete, serverTimestamp: () => fieldServer },
    FieldPath: { documentId: () => '__name__' }, Timestamp: class { constructor(seconds, nanoseconds) { this.seconds = seconds; this.nanoseconds = nanoseconds; } isEqual(other) { return other?.seconds === this.seconds && other?.nanoseconds === this.nanoseconds; } }, GeoPoint: class {}, DocumentReference: class {} });
  const storage = { bucket: () => ({ file: (path, options) => ({
    async save(bytes, settings) { assert.equal(settings.preconditionOpts.ifGenerationMatch, 0); assert.equal(objects.has(path), false);
      objects.set(path, { body: Buffer.from(bytes), generation: '1', metadata: settings.metadata.metadata }); await state.onSave?.(path); },
    async getMetadata() { state.storageReads++; const object = objects.get(path); if (!object || (options?.generation && options.generation !== object.generation)) throw Object.assign(new Error('private object missing'), { code: 404 });
      return [{ generation: object.generation, size: object.body.length, metadata: object.metadata }]; },
    async exists() { return [objects.has(path)]; },
    async download() { state.storageReads++; await state.onDownload?.(path); const object = objects.get(path);
      if (!object || (options?.generation && options.generation !== object.generation)) throw new Error('private object missing'); return [Buffer.from(object.body)]; },
    async getSignedUrl() { state.signs++; throw new Error('Storage signing forbidden'); },
    async delete(settings) { const object = objects.get(path); if (!object) return;
      assert.equal(settings.ifGenerationMatch, options.generation); assert.equal(object.generation, settings.ifGenerationMatch);
      objects.delete(path); },
  }) }) };
  const admin = { firestore, storage: () => storage, app: () => ({ options: { projectId } }),
    auth: () => ({ async verifyIdToken(token, revoked) { state.verifyCalls++; assert.equal(revoked, true);
      if (token !== 'synthetic-current-token' || state.revoked) throw new Error('private credential details'); return { uid, admin: state.adminRole }; }, async getUser(userId) { assert.equal(userId, uid); return { uid, disabled: state.disabled, customClaims: { admin: state.adminRole } }; } }) };
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  const exports = {};
  vm.runInNewContext(output, { exports, Buffer, Date: FixtureDate, URL, AbortController, setTimeout, clearTimeout,
    process: { env: {} }, require(name) { if (name === 'firebase-admin') return admin;
      if (name === 'firebase-functions/v2/https') return { HttpsError, onCall: (options, callback) => callback || options, onRequest: (_options, callback) => callback };
      if (name === 'firebase-functions/v2/scheduler') return { onSchedule: (_options, callback) => callback };
      return require(name); } });
  const receiptHash = 'a'.repeat(64), expiresAt = new Date(state.now + 60 * 60 * 1000).toISOString();
  documents.set(`consentRecords/${uid}_data_export`, { uid, purpose: 'data.export', consentTier: 'C7', status: 'granted', policyVersion: '1.0.0', receiptHash, expiresAt });
  documents.set(`privacyDeletionTombstones/${uid}`, { uid, active: false, exportConsentStatus: 'granted', exportConsentPolicyVersion: '1.0.0', exportConsentReceiptHash: receiptHash, exportConsentExpiresAt: expiresAt });
  documents.set(`users/${uid}`, { uid, name: 'Synthetic example' });
  const callable = (name, data = {}, admin = false) => exports[name]({ auth: { uid, token: { admin } }, data, rawRequest: { get: name => name.toLowerCase() === 'authorization' ? 'Bearer synthetic-current-token' : 'untrusted.example' } });
  async function http(url, { token = 'synthetic-current-token', onChunk, method = 'GET', origin, requestedMethod = 'GET', requestedHeaders = 'Authorization' } = {}) {
    const endpoint = new URL(url), response = new Response(onChunk);
    const headers = { authorization: token ? `Bearer ${token}` : '', origin,
      'access-control-request-method': requestedMethod, 'access-control-request-headers': requestedHeaders };
    await exports.downloadStudioDataExport({ method, query: Object.fromEntries(endpoint.searchParams), get: name => headers[name.toLowerCase()] }, response);
    return response;
  }
  return { state, documents, objects, callable, http, sweep: () => exports.reconcileStudioDataExportPackages({}), async prepare(large = false) {
    if (large) documents.set(`users/${uid}`, { uid, payload: 's'.repeat(3 * 64 * 1024) });
    const created = await callable('requestStudioDataExport'); const descriptor = await callable('getStudioDataExportDownload', { requestId: created.requestId });
    assert.equal(descriptor.requiresAuthorization, true); assert.equal(state.signs, 0);
    assert.equal(new URL(descriptor.url).hostname, `us-central1-${projectId}.cloudfunctions.net`);
    assert.equal(new URL(descriptor.url).pathname, '/downloadStudioDataExport');
    assert.equal(descriptor.url.includes('untrusted.example'), false);
    return descriptor;
  } };
}
let cases = 0;
for (const origin of ['https://uraistudio.com', 'https://www.uraistudio.com', `https://${projectId}.web.app`,
  `https://${projectId}.firebaseapp.com`, `https://${projectId}--fixture-preview-123.web.app`]) {
  const h = harness(), response = await h.http('https://unused.example/', { method: 'OPTIONS', token: '', origin });
  assert.equal(response.statusCode, 204); assert.equal(response.headers['Access-Control-Allow-Origin'], origin);
  assert.equal(response.headers['Access-Control-Allow-Methods'], 'GET'); assert.equal(response.headers['Access-Control-Allow-Headers'], 'Authorization');
  assert.equal(response.headers['Access-Control-Allow-Credentials'], undefined);
  assert.deepEqual([h.state.verifyCalls, h.state.firestoreReads, h.state.storageReads], [0, 0, 0]); cases++;
}
for (const origin of ['https://foreign.example', 'https://foreign--preview.web.app', `https://${projectId}.web.app.evil.example`,
  'https://www.uraistudio.com:8443', 'https://www.uraistudio.com/path', 'https://localhost', 'capacitor://localhost', 'null']) {
  const h = harness(), response = await h.http('https://unused.example/', { origin });
  assert.equal(response.statusCode, 403); assert.equal(response.headers['Access-Control-Allow-Origin'], undefined);
  assert.deepEqual([h.state.verifyCalls, h.state.firestoreReads, h.state.storageReads], [0, 0, 0]); cases++;
}
for (const options of [{ requestedMethod: 'POST' }, { requestedHeaders: 'Authorization, X-Caller-Authority' },
  { requestedHeaders: '' }, { origin: undefined }]) {
  const h = harness(), response = await h.http('https://unused.example/', { method: 'OPTIONS', token: '', origin: 'https://www.uraistudio.com', ...options });
  assert.notEqual(response.statusCode, 204);
  assert.deepEqual([h.state.verifyCalls, h.state.firestoreReads, h.state.storageReads], [0, 0, 0]); cases++;
}
{
  const h = harness(), descriptor = await h.prepare(), response = await h.http(descriptor.url, { origin: 'https://www.uraistudio.com' });
  assert.equal(response.writableFinished, true); assert.equal(response.headers['Access-Control-Allow-Origin'], 'https://www.uraistudio.com');
  assert.equal(response.headers['Access-Control-Allow-Credentials'], undefined); cases++;
}
{
  const h = harness(), descriptor = await h.prepare(), response = await h.http(descriptor.url);
  assert.equal(response.writableFinished, true); const body = Buffer.concat(response.chunks);
  assert.equal(hash(body), descriptor.checksum); assert.equal(JSON.parse(body).kind, 'export'); assert.match(response.headers['Cache-Control'], /no-store/); cases++;
}
for (const reason of ['consent', 'new-receipt', 'central-delete', 'studio-delete', 'completed-delete', 'foreign-owner', 'source-change', 'generation', 'expired', 'no-token', 'revoked-token']) {
  const h = harness(), descriptor = await h.prepare(), record = h.documents.get(`studioDataRightsRequests/${descriptor.requestId}`);
  if (reason === 'consent') h.documents.get(`consentRecords/${uid}_data_export`).status = 'revoked';
  if (reason === 'new-receipt') { h.documents.get(`consentRecords/${uid}_data_export`).receiptHash = 'b'.repeat(64); h.documents.get(`privacyDeletionTombstones/${uid}`).exportConsentReceiptHash = 'b'.repeat(64); }
  if (reason === 'central-delete') h.documents.get(`privacyDeletionTombstones/${uid}`).active = true;
  if (['studio-delete', 'completed-delete'].includes(reason)) h.documents.set(`studioDataRightsOwnerFences/${hash(`urai-studio-data-rights:${uid}`)}`, { uid, active: true, permanent: reason === 'completed-delete' });
  if (reason === 'foreign-owner') record.uid = 'foreign-owner';
  if (reason === 'source-change') record.packageReceipt.checksum = 'f'.repeat(64);
  if (reason === 'generation') h.objects.get(record.packageReceipt.objectPath).generation = '2';
  if (reason === 'expired') h.state.now = descriptor.downloadExpiresAt;
  if (reason === 'revoked-token') h.state.revoked = true;
  const response = await h.http(descriptor.url, { token: reason === 'no-token' ? '' : 'synthetic-current-token' });
  assert.notEqual(response.statusCode, 200, reason); assert.equal(response.chunks.length, 0, reason); assert.equal(h.state.signs, 0); cases++;
}
for (const reason of ['consent', 'token', 'deadline', 'deletion']) {
  const h = harness(), descriptor = await h.prepare(true);
  const response = await h.http(descriptor.url, { onChunk(count) {
    if (count !== 1) return;
    if (reason === 'consent') h.documents.get(`consentRecords/${uid}_data_export`).status = 'revoked';
    if (reason === 'token') h.state.revoked = true;
    if (reason === 'deadline') h.state.now = descriptor.downloadExpiresAt;
    if (reason === 'deletion') h.documents.get(`privacyDeletionTombstones/${uid}`).active = true;
  } });
  assert.equal(response.writableFinished, false); assert.equal(Buffer.concat(response.chunks).length, 64 * 1024, reason); cases++;
}
for (const revokeAtTransaction of [3, 4]) {
  const h = harness(), descriptor = await h.prepare(true); let transactions = 0;
  h.state.onTransaction = async () => { if (++transactions === revokeAtTransaction) h.state.revoked = true; };
  const response = await h.http(descriptor.url);
  assert.equal(response.writableFinished, false);
  assert.equal(Buffer.concat(response.chunks).length, revokeAtTransaction === 3 ? 0 : 64 * 1024,
    'Token withdrawal during the current receipt read must deny the next chunk'); cases++;
}
{
  const h = harness(), descriptor = await h.prepare();
  h.state.onDownload = async () => { h.state.onDownload = null; h.documents.get(`consentRecords/${uid}_data_export`).status = 'revoked'; };
  const response = await h.http(descriptor.url); assert.equal(response.statusCode, 409); assert.equal(response.chunks.length, 0); cases++;
}
{
  const h = harness(); h.state.onSave = async () => { h.state.onSave = null; h.documents.get(`consentRecords/${uid}_data_export`).status = 'revoked'; };
  await assert.rejects(h.callable('requestStudioDataExport'), error => error.code === 'failed-precondition');
  const intent = [...h.documents.values()].find(value => value.status === 'preparing');
  assert.ok(intent.privatePackageIntent); assert.equal(h.objects.has(intent.privatePackageIntent), true); cases++;
}
{
  const h = harness(), descriptor = await h.prepare();
  h.state.onSave = async () => { h.state.onSave = null; const result = await h.http(descriptor.url); assert.equal(result.statusCode, 409); };
  const deletion = await h.callable('requestStudioDataDeletion');
  assert.equal((await h.http(descriptor.url)).statusCode, 409);
  await h.callable('cancelStudioDataDeletion', { requestId: deletion.requestId });
  assert.equal((await h.http(descriptor.url)).writableFinished, true); cases++;
}
{
  const h = harness(), descriptor = await h.prepare();
  const path = h.documents.get(`studioDataRightsRequests/${descriptor.requestId}`).packageReceipt.objectPath;
  h.documents.get(`consentRecords/${uid}_data_export`).status = 'revoked';
  await h.sweep(); assert.equal(h.objects.has(path), false);
  const record = h.documents.get(`studioDataRightsRequests/${descriptor.requestId}`);
  assert.equal(record.status, 'package_purged'); assert.equal(record.packagePurgeReceipt.generation, '1');
  assert.equal(record.packagePurgeReceipt.globalErasureVerified, false); cases++;
}
{
  const h = harness(), descriptor = await h.prepare();
  h.state.now = descriptor.packageExpiresAt; await h.sweep();
  assert.equal(h.documents.get(`studioDataRightsRequests/${descriptor.requestId}`).status, 'package_purged'); cases++;
}
{
  const h = harness(); h.state.onSave = async () => { h.state.onSave = null; h.documents.get(`consentRecords/${uid}_data_export`).status = 'revoked'; };
  await assert.rejects(h.callable('requestStudioDataExport'));
  const [recordPath, intent] = [...h.documents].find(([, value]) => value.status === 'preparing');
  const object = h.objects.get(intent.privatePackageIntent); h.objects.delete(intent.privatePackageIntent);
  h.state.now += 16 * 60 * 1000; await h.sweep();
  assert.equal(h.documents.get(recordPath).status, 'package_purge_pending'); assert.equal(h.documents.get(recordPath).privatePackageIntent, intent.privatePackageIntent);
  assert.equal(h.documents.get(recordPath).packagePurgeReceipt, undefined);
  h.objects.set(intent.privatePackageIntent, object); await h.sweep();
  assert.equal(h.documents.get(recordPath).status, 'package_purged'); assert.equal(h.objects.has(intent.privatePackageIntent), false); cases++;
}
{
  const h = harness(), descriptor = await h.prepare();
  const exportPath = h.documents.get(`studioDataRightsRequests/${descriptor.requestId}`).packageReceipt.objectPath;
  const deletion = await h.callable('requestStudioDataDeletion');
  const backupPath = h.documents.get(`studioDataRightsRequests/${deletion.requestId}`).backupReceipt.objectPath;
  h.state.now += 8 * 24 * 60 * 60 * 1000;
  const result = await h.callable('executeStudioDataDeletion', { requestId: deletion.requestId }, true);
  assert.equal(h.objects.has(exportPath), false); assert.equal(h.objects.has(backupPath), true);
  assert.equal(result.purgeReceipt.privatePackageCleanup.deleted, 1); assert.equal(result.purgeReceipt.globalErasureVerified, false);
  assert.equal((await h.http(descriptor.url)).chunks.length, 0); cases++;
}
{
  const h = harness(), deletion = await h.callable('requestStudioDataDeletion');
  const path = h.documents.get(`studioDataRightsRequests/${deletion.requestId}`).backupReceipt.objectPath;
  await h.callable('cancelStudioDataDeletion', { requestId: deletion.requestId });
  await h.sweep(); assert.equal(h.objects.has(path), true);
  h.state.now += 31 * 24 * 60 * 60 * 1000;
  await h.callable('setStudioDataDeletionLegalHold', { requestId: deletion.requestId, active: true, reason: 'Synthetic retained backup legal hold' }, true);
  await h.sweep(); assert.equal(h.objects.has(path), true);
  await h.callable('setStudioDataDeletionLegalHold', { requestId: deletion.requestId, active: false }, true);
  await h.sweep(); assert.equal(h.objects.has(path), false);
  assert.equal(h.documents.get(`studioDataRightsRequests/${deletion.requestId}`).backupPurgeState, 'purged');
  await assert.rejects(h.callable('setStudioDataDeletionLegalHold', { requestId: deletion.requestId, active: true, reason: 'Synthetic late hold' }, true)); cases++;
}
{
  const h = harness(), deletion = await h.callable('requestStudioDataDeletion'); h.state.now += 8 * 24 * 60 * 60 * 1000;
  h.state.onDownload = async () => { h.state.onDownload = null;
    await h.callable('setStudioDataDeletionLegalHold', { requestId: deletion.requestId, active: true, reason: 'Synthetic before admission' }, true);
  };
  await assert.rejects(h.callable('executeStudioDataDeletion', { requestId: deletion.requestId }, true));
  assert.equal(h.documents.has(`users/${uid}`), true); assert.equal(h.documents.get(`studioDataRightsRequests/${deletion.requestId}`).status, 'pending_restore_window'); cases++;
}
{
  const h = harness(), deletion = await h.callable('requestStudioDataDeletion');
  const receipt = h.documents.get(`studioDataRightsRequests/${deletion.requestId}`).backupReceipt;
  h.objects.get(receipt.objectPath).generation = '2'; h.state.now += 8 * 24 * 60 * 60 * 1000;
  await assert.rejects(h.callable('executeStudioDataDeletion', { requestId: deletion.requestId }, true));
  assert.equal(h.documents.has(`users/${uid}`), true); cases++;
}
let negativeFailures = 0;
for (const reason of ['foreign-owner', 'same-owner-version', 'cancelled', 'subject', 'legal-hold', 'owner-fence', 'foreign-attempt', 'token', 'admin-role', 'disabled-admin']) {
  const h = harness(), descriptor = await h.prepare();
  const target = `studioScenes/synthetic-deletion-target`;
  h.documents.set(target, { uid, preserved: 'synthetic source data' });
  const deletion = await h.callable('requestStudioDataDeletion'); h.state.now += 8 * 24 * 60 * 60 * 1000;
  const requestPath = `studioDataRightsRequests/${deletion.requestId}`;
  const exportPath = h.documents.get(`studioDataRightsRequests/${descriptor.requestId}`).packageReceipt.objectPath;
  h.state.onDownload = async path => { if (path !== exportPath) return; h.state.onDownload = null;
    if (reason === 'foreign-owner') h.documents.get(target).uid = 'synthetic-foreign-owner';
    if (reason === 'same-owner-version') h.documents.get(target).preserved = 'synthetic corrected source';
    if (reason === 'cancelled') h.documents.get(requestPath).status = 'cancelled';
    if (reason === 'subject') h.documents.get(requestPath).uid = 'synthetic-foreign-owner';
    if (reason === 'legal-hold') h.documents.get(requestPath).legalHold = true;
    if (reason === 'owner-fence') h.documents.get(`studioDataRightsOwnerFences/${hash(`urai-studio-data-rights:${uid}`)}`).active = false;
    if (reason === 'foreign-attempt') h.documents.get(requestPath).executionAttemptToken = 'synthetic-successor';
    if (reason === 'token') h.state.revoked = true;
    if (reason === 'admin-role') h.state.adminRole = false;
    if (reason === 'disabled-admin') h.state.disabled = true;
  };
  try {
    await assert.rejects(h.callable('executeStudioDataDeletion', { requestId: deletion.requestId }, true));
    assert.equal(h.documents.has(target), true); assert.equal(h.documents.has(`users/${uid}`), true);
    assert.notEqual(h.documents.get(requestPath).status, 'completed');
    if (!['foreign-owner', 'same-owner-version'].includes(reason)) assert.equal(h.objects.has(exportPath), true, 'withdrawn destructive authority must preserve the not-yet-deleted generation'); cases++;
    console.log(`[PASS] deletion authority after awaited package read: ${reason}`);
  } catch (error) { negativeFailures++; console.log(`[FAIL] deletion authority after awaited package read: ${reason}: ${error.message}`); }
}
for (const reason of ['foreign-owner-before-commit', 'same-owner-before-commit', 'foreign-owner-after-target-read', 'role-after-target-read', 'completion-authority']) {
  const h = harness(), target = `studioScenes/synthetic-atomic-target`;
  h.documents.set(target, { uid, preserved: 'synthetic source data' });
  const deletion = await h.callable('requestStudioDataDeletion'); h.state.now += 8 * 24 * 60 * 60 * 1000;
  const requestPath = `studioDataRightsRequests/${deletion.requestId}`;
  if (reason.includes('before-commit')) h.state.onBeforeTransactionCommit = async (reads, writes) => {
    if (!reads.has(target) || !writes.length) return; h.state.onBeforeTransactionCommit = null;
    if (reason === 'foreign-owner-before-commit') h.documents.get(target).uid = 'synthetic-foreign-owner';
    else h.documents.get(target).preserved = 'synthetic corrected source';
  };
  if (reason.includes('after-target-read')) h.state.onTransactionRead = async path => {
    if (path !== target) return; h.state.onTransactionRead = null;
    if (reason === 'role-after-target-read') h.state.adminRole = false;
    else h.documents.get(target).uid = 'synthetic-foreign-owner';
  };
  if (reason === 'completion-authority') h.state.onTransaction = async () => {
    if (h.documents.has(target)) return; h.state.onTransaction = null;
    h.documents.get(requestPath).status = 'cancelled';
  };
  try {
    await assert.rejects(h.callable('executeStudioDataDeletion', { requestId: deletion.requestId }, true));
    if (reason !== 'completion-authority') { assert.equal(h.documents.has(target), true); assert.equal(h.documents.has(`users/${uid}`), true); }
    assert.notEqual(h.documents.get(requestPath).status, 'completed'); cases++;
    console.log(`[PASS] atomic deletion authority: ${reason}`);
  } catch (error) { negativeFailures++; console.log(`[FAIL] atomic deletion authority: ${reason}: ${error.message}`); }
}
{
  const h = harness();
  for (let index = 0; index < 902; index++) h.documents.set(`studioScenes/synthetic_${String(index).padStart(4, '0')}`, { uid });
  const deletion = await h.callable('requestStudioDataDeletion'); h.state.now += 8 * 24 * 60 * 60 * 1000;
  const result = await h.callable('executeStudioDataDeletion', { requestId: deletion.requestId }, true);
  assert.equal(result.purgeReceipt.counts.studioScenes.deleted, 902); assert.equal(result.purgeReceipt.counts.users.deleted, 1);
  assert.equal([...h.documents.keys()].some(path => path.startsWith('studioScenes/')), false); cases++;
}
const continuationCases = [], continuation = (name, callback) => continuationCases.push({ name, callback });
const scene = index => `studioScenes/continuation_${String(index).padStart(5, '0')}`;
async function preparedDeletion(count = 902, audit = false) {
  const h = harness(); for (let index = 0; index < count; index++) h.documents.set(scene(index), { uid, private: 'Synthetic original bytes' });
  if (audit) h.documents.set('studioEvents/continuation_audit', { uid, private: 'Synthetic audit private bytes' });
  const deletion = await h.callable('requestStudioDataDeletion'); h.state.now += 8 * 24 * 60 * 60 * 1000;
  return { h, deletion, path: `studioDataRightsRequests/${deletion.requestId}`, execute: () => h.callable('executeStudioDataDeletion', { requestId: deletion.requestId }, true) };
}
for (const reason of ['same-owner', 'foreign-owner']) continuation(`original backup version survives restore window: ${reason}`, async () => {
  const f = await preparedDeletion(1); if (reason === 'same-owner') f.h.documents.get(scene(0)).private = 'Synthetic correction after original backup';
  else f.h.documents.get(scene(0)).uid = 'synthetic-foreign-owner';
  await assert.rejects(f.execute()); assert.equal(f.h.documents.has(scene(0)), true); assert.notEqual(f.h.documents.get(f.path).status, 'completed');
});
continuation('ambiguous committed batch resumes exact original cursor/counts and anonymization once', async () => {
  const f = await preparedDeletion(902, true); let interrupted = false;
  f.h.state.onTransaction = async () => { if (interrupted || f.h.documents.has(scene(0))) return; interrupted = true; throw new Error('Synthetic lost commit acknowledgement'); };
  await assert.rejects(f.execute()); assert.equal(f.h.documents.get(f.path).deletionProgress.nextTargetIndex, 400);
  const planHash = f.h.documents.get(f.path).deletionPlanHash;
  const result = await f.execute(); assert.equal(result.status, 'completed'); assert.equal(result.purgeReceipt.deletionPlanHash, planHash);
  assert.equal(result.purgeReceipt.counts.studioScenes.deleted, 902); assert.equal(result.purgeReceipt.counts.studioEvents.anonymized, 1);
  assert.equal(f.h.documents.get('studioEvents/continuation_audit').private, undefined); assert.ok(f.h.state.maxWrites <= 450);
  const replay = await f.execute(); assert.equal(replay.replay, true); assert.equal(replay.purgeReceipt.receiptId, result.purgeReceipt.receiptId);
});
for (const reason of ['same-owner', 'foreign-owner', 'hold', 'role', 'cursor']) continuation(`partial interruption preserves remaining original authority: ${reason}`, async () => {
  const f = await preparedDeletion(); let interrupted = false;
  f.h.state.onTransaction = async () => { if (interrupted || f.h.documents.has(scene(0))) return; interrupted = true; throw new Error('Synthetic interruption'); };
  await assert.rejects(f.execute()); const current = f.h.documents.get(f.path);
  if (reason === 'same-owner') f.h.documents.get(scene(500)).private = 'Synthetic corrected remaining bytes';
  if (reason === 'foreign-owner') f.h.documents.get(scene(500)).uid = 'synthetic-foreign-owner';
  if (reason === 'hold') await f.h.callable('setStudioDataDeletionLegalHold', { requestId: f.deletion.requestId, active: true, reason: 'Synthetic recovery legal hold' }, true);
  if (reason === 'role') f.h.state.adminRole = false;
  if (reason === 'cursor') current.deletionProgress.nextTargetIndex += 1;
  await assert.rejects(f.execute()); assert.equal(f.h.documents.has(scene(500)), true); assert.notEqual(f.h.documents.get(f.path).status, 'completed');
  if (reason !== 'cursor') assert.equal(f.h.documents.get(f.path).deletionProgress.nextTargetIndex, 400);
});
continuation('active original attempt denies duplicate execution', async () => {
  const f = await preparedDeletion(); let checked = false;
  f.h.state.onTransaction = async () => { if (checked || f.h.documents.has(scene(0))) return; checked = true;
    await assert.rejects(f.execute(), error => error.code === 'unavailable');
  };
  const result = await f.execute(); assert.equal(checked, true); assert.equal(result.purgeReceipt.counts.studioScenes.deleted, 902);
  assert.equal(f.h.documents.get(f.path).executionAttemptNumber, 1);
});
for (const lateFailure of [false, true]) continuation(`expired interrupted predecessor cannot overwrite successor: ${lateFailure ? 'failure' : 'success'}`, async () => {
  const f = await preparedDeletion(); let entered, release, blockedOnce = false;
  const started = new Promise(resolve => { entered = resolve; }), block = new Promise(resolve => { release = resolve; });
  f.h.state.onTransaction = async () => { if (blockedOnce || f.h.documents.has(scene(0))) return; blockedOnce = true; entered(); await block;
    if (lateFailure) throw new Error('Synthetic late predecessor failure');
  };
  const first = f.execute(); first.catch(() => {}); await started; f.h.state.now += 15 * 60 * 1000 + 1;
  let second; try { second = await f.execute(); } finally { release(); }
  await assert.rejects(first); assert.equal(second.status, 'completed'); assert.equal(second.purgeReceipt.counts.studioScenes.deleted, 902);
  assert.equal(f.h.documents.get(f.path).status, 'completed'); assert.equal((await f.execute()).replay, true);
});
for (const reason of ['restored-original', 'new-owned']) continuation(`residual late writer cannot become completed receipt: ${reason}`, async () => {
  const f = await preparedDeletion(1); let written = false;
  f.h.state.onTransaction = async () => { if (written || f.h.documents.has(scene(0))) return; written = true;
    f.h.documents.set(reason === 'restored-original' ? scene(0) : 'studioScenes/new_late_source', { uid, private: 'Synthetic late writer bytes' });
  };
  await assert.rejects(f.execute()); const target = reason === 'restored-original' ? scene(0) : 'studioScenes/new_late_source';
  assert.equal(f.h.documents.has(target), true); assert.notEqual(f.h.documents.get(f.path).status, 'completed');
});
continuation('legacy unversioned backup cannot acquire a new target plan silently', async () => {
  const f = await preparedDeletion(1), receipt = f.h.documents.get(f.path).backupReceipt, object = f.h.objects.get(receipt.objectPath);
  const payload = JSON.parse(object.body); delete payload.deletionPlan; object.body = Buffer.from(JSON.stringify(payload));
  object.metadata.checksum = receipt.checksum = hash(object.body); delete receipt.deletionPlanHash; delete receipt.deletionPlanSchemaVersion; delete receipt.deletionTargetCount;
  await assert.rejects(f.execute()); assert.equal(f.h.documents.has(scene(0)), true); assert.equal(f.h.documents.get(f.path).status, 'pending_restore_window');
});
continuation('bounded original plan resumes beyond one 8000-target delivery', async () => {
  const f = await preparedDeletion(8102), first = await f.execute(); assert.equal(first.status, 'execution_continuation_required');
  assert.equal(f.h.documents.get(f.path).deletionProgress.nextTargetIndex, 8000); assert.equal(f.h.documents.get(f.path).deletionFailureAttempts, 0);
  const second = await f.execute(); assert.equal(second.status, 'completed'); assert.equal(second.purgeReceipt.counts.studioScenes.deleted, 8102);
  assert.equal(f.h.documents.get(f.path).deletionContinuationDeliveries, 1); assert.ok(f.h.state.maxWrites <= 450);
});
continuation('repeated genuine failures exhaust reviewed retry budget without another mutation', async () => {
  const f = await preparedDeletion(1); f.h.state.onTransactionRead = async path => { if (path === scene(0)) throw new Error('Synthetic backend read interruption'); };
  for (let index = 1; index <= 3; index++) { await assert.rejects(f.execute()); assert.equal(f.h.documents.get(f.path).deletionFailureAttempts, index); }
  await assert.rejects(f.execute(), error => error.code === 'resource-exhausted'); assert.equal(f.h.documents.has(scene(0)), true);
  assert.equal(f.h.documents.get(f.path).executionAttemptNumber, 3);
});
continuation('already absent original target is acknowledged without fabricating a delete', async () => {
  const f = await preparedDeletion(1); f.h.documents.delete(scene(0)); const result = await f.execute();
  assert.equal(result.purgeReceipt.counts.studioScenes.deleted, 0); assert.equal(result.purgeReceipt.counts.studioScenes.observedAbsent, 1);
});
continuation('late owned insertion conflicts with transactional completion emptiness reads', async () => {
  const f = await preparedDeletion(1); let inserted = false;
  f.h.state.onBeforeTransactionCommit = async (reads, writes) => { if (inserted || !reads.has(f.path) || writes.length !== 1 || f.h.documents.has(scene(0)) || f.h.documents.has(`users/${uid}`)) return;
    inserted = true; f.h.documents.set('studioScenes/phantom_late_writer', { uid, private: 'Synthetic late owner bytes' });
  };
  await assert.rejects(f.execute()); assert.equal(inserted, true); assert.equal(f.h.documents.has('studioScenes/phantom_late_writer'), true);
  assert.notEqual(f.h.documents.get(f.path).status, 'completed');
});
for (const reason of ['credential', 'legal-hold']) continuation(`deletion backup preparation preserves awaited authority: ${reason}`, async () => {
  const h = harness(); h.state.onSave = async path => { h.state.onSave = null;
    if (reason === 'credential') h.state.revoked = true;
    else await h.callable('setStudioDataDeletionLegalHold', { requestId: path.split('/').at(-1).replace(/\.json$/, ''), active: true, reason: 'Synthetic preparation hold' }, true);
  };
  await assert.rejects(h.callable('requestStudioDataDeletion'));
  const record = [...h.documents.values()].find(value => value.type === 'delete'); assert.equal(record.status, 'preparing_deletion_backup');
  if (reason === 'legal-hold') assert.equal(record.legalHold, true);
  assert.equal(h.documents.has(`users/${uid}`), true);
});
continuation('withdrawn admin cannot alter retained backup hold authority', async () => {
  const h = harness(), deletion = await h.callable('requestStudioDataDeletion'); h.state.adminRole = false;
  await assert.rejects(h.callable('setStudioDataDeletionLegalHold', { requestId: deletion.requestId, active: true, reason: 'Synthetic denied hold mutation' }, true));
  assert.equal(h.documents.get(`studioDataRightsRequests/${deletion.requestId}`).legalHold, false);
});
continuation('withdrawn preparation token cannot install an owner fence after its read', async () => {
  const h = harness(); h.state.onTransactionRead = async path => {
    if (path.startsWith('studioDataRightsOwnerFences/')) h.state.revoked = true;
  };
  await assert.rejects(h.callable('requestStudioDataDeletion'));
  assert.equal([...h.documents.values()].some(value => value.type === 'delete'), false);
  assert.equal([...h.documents.keys()].some(path => path.startsWith('studioDataRightsOwnerFences/')), false);
  assert.equal(h.objects.size, 0);
});
for (const reason of ['subject', 'restore-window', 'backup-count']) continuation(`admitted original operation remains bound: ${reason}`, async () => {
  const f = await preparedDeletion(1); let changed = false;
  f.h.state.onTransaction = async () => { const record = f.h.documents.get(f.path);
    if (changed || record.status !== 'executing') return; changed = true;
    if (reason === 'subject') record.subjectHash = 'f'.repeat(64);
    if (reason === 'restore-window') record.restoreUntil = new Date(f.h.state.now + 1000).toISOString();
    if (reason === 'backup-count') record.backupReceipt.deletionTargetCount++;
  };
  await assert.rejects(f.execute()); assert.equal(changed, true);
  assert.equal(f.h.documents.has(scene(0)), true); assert.equal(f.h.documents.get(f.path).deletionProgress.nextTargetIndex, 0);
});
for (const entry of continuationCases) { try { await entry.callback(); cases++; console.log(`[PASS] Studio original-plan recovery: ${entry.name}`); }
  catch (error) { negativeFailures++; console.log(`[FAIL] Studio original-plan recovery: ${entry.name}: ${error.message}`); } }
console.log(JSON.stringify({ kind: 'actual-Studio-handler-source-with-explicit-Firebase-adapters', node: process.version,
  typescript: ts.version, passed: cases, failed: negativeFailures, loadedFunctions: false, deployedRuntime: false,
  storageSigning: 0, providerCalls: 0 }));
if (negativeFailures) process.exitCode = 1;
