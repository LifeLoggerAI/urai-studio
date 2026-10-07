import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { Writable } from 'node:stream';
const require = createRequire(new URL('../../../functions/package.json', import.meta.url));
const ts = require('typescript'), uid = 'synthetic-owner', projectId = 'demo-urai-studio';
const source = fs.readFileSync(new URL('../../../functions/src/data-rights.ts', import.meta.url), 'utf8');
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
  const documents = new Map(), objects = new Map(), state = { now: Date.now(), sequence: 0, revoked: false, signs: 0, onDownload: null, onSave: null, onTransaction: null, verifyCalls: 0, firestoreReads: 0, storageReads: 0 };
  class FixtureDate extends Date { constructor(...args) { super(...(args.length ? args : [state.now])); } static now() { return state.now; } }
  const fieldDelete = '__DELETE__', fieldServer = '__TIMESTAMP__';
  function patch(path, value, merge) { const out = merge ? structuredClone(documents.get(path) || {}) : {};
    for (const [key, entry] of Object.entries(value)) { if (entry === fieldDelete) delete out[key]; else out[key] = entry === fieldServer ? new Date(state.now).toISOString() : structuredClone(entry); }
    documents.set(path, out); }
  const snapshot = ref => ({ ref, id: ref.id, exists: documents.has(ref.path), data: () => structuredClone(documents.get(ref.path)) });
  const reference = path => ({ path, id: path.split('/').at(-1), get: async () => snapshot(reference(path)),
    set: async (value, options) => patch(path, value, options?.merge), collection: child => collection(`${path}/${child}`) });
  function collection(name) { const filters = [];
    const query = { doc: id => reference(`${name}/${id || `synthetic_request_${++state.sequence}`}`),
      where(field, op, value) { filters.push([field, op, value]); return this; }, orderBy() { return this; }, limit() { return this; }, startAfter() { return this; },
      async get() { const docs = [...documents].filter(([key, value]) => key.startsWith(`${name}/`) && key.split('/').length === name.split('/').length + 1
        && filters.every(([field, op, expected]) => op === '==' && value[field] === expected)).map(([key]) => snapshot(reference(key)));
        return { docs, size: docs.length }; } };
    return query;
  }
  const db = { collection, async runTransaction(callback) { const writes = [];
    const tx = { get: async ref => { state.firestoreReads++; return snapshot(ref); }, create: (ref, value) => writes.push(() => { assert.equal(documents.has(ref.path), false); patch(ref.path, value, false); }),
      set: (ref, value, options) => writes.push(() => patch(ref.path, value, options?.merge)), update: (ref, value) => writes.push(() => patch(ref.path, value, true)) };
    const result = await callback(tx); for (const write of writes) write(); await state.onTransaction?.(); return result; }, batch() {
      const writes = []; return { delete: ref => writes.push(() => documents.delete(ref.path)),
        set: (ref, value) => writes.push(() => patch(ref.path, value, false)), async commit() { for (const write of writes) write(); } };
    } };
  const firestore = Object.assign(() => db, { FieldValue: { delete: () => fieldDelete, serverTimestamp: () => fieldServer },
    FieldPath: { documentId: () => '__name__' }, Timestamp: class {}, GeoPoint: class {}, DocumentReference: class {} });
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
      if (token !== 'synthetic-current-token' || state.revoked) throw new Error('private credential details'); return { uid }; } }) };
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
console.log(`[PASS] ${cases} actual Studio export callable/HTTP/Storage cases; canonical consent, receipt/generation, deletion fences, withdrawal across awaits and ongoing streams; Storage signing/provider calls=0`);
