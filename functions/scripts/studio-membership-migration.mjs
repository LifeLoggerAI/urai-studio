#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import admin from 'firebase-admin';
import {
  buildMigrationPlan,
  normalizeFirestoreDocument,
  normalizeFirestoreValue,
  sha256,
  validateAuthorityManifest,
  validateReceipt,
} from './studio-membership-migration-lib.mjs';

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) fail(`unexpected argument: ${token}`);
    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    const value = inlineValue ?? rest[++index];
    if (!value || value.startsWith('--')) fail(`--${rawKey} requires a value`);
    options[rawKey] = value;
  }
  return {command, options};
}

function readJson(filePath, label) {
  if (!filePath) fail(`${label} path is required`);
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
}

function writePrivateJson(filePath, value) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), {recursive: true, mode: 0o700});
  if (fs.existsSync(resolved) && fs.lstatSync(resolved).isSymbolicLink()) fail('refusing to write a receipt through a symbolic link');
  const handle = fs.openSync(resolved, 'w', 0o600);
  try {
    fs.writeFileSync(handle, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.fchmodSync(handle, 0o600);
  } finally {
    fs.closeSync(handle);
  }
}

function requireProject(options, key = 'project') {
  const projectId = options[key];
  if (!projectId || projectId.includes('/') || projectId === '.' || projectId === '..') fail(`--${key} must name the exact Firebase project`);
  return projectId;
}

function requireMaxDocuments(options) {
  const maxDocuments = Number.parseInt(options['max-documents'] ?? '5000', 10);
  if (!Number.isSafeInteger(maxDocuments) || maxDocuments < 1 || maxDocuments > 100000) {
    fail('--max-documents must be an integer from 1 to 100000');
  }
  return maxDocuments;
}

function initialize(projectId) {
  if (!admin.apps.length) admin.initializeApp({credential: admin.credential.applicationDefault(), projectId});
  const configured = admin.app().options.projectId;
  if (configured !== projectId) fail(`initialized Firebase project ${configured ?? '(unknown)'} does not match ${projectId}`);
  return admin.firestore();
}

async function loadCollection(collection, maxDocuments) {
  const records = [];
  let cursor = null;
  while (records.length <= maxDocuments) {
    let query = collection.orderBy(admin.firestore.FieldPath.documentId()).limit(Math.min(500, maxDocuments + 1 - records.length));
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    for (const document of snapshot.docs) records.push({id: document.id, data: normalizeFirestoreDocument(document.data())});
    if (snapshot.size === 0 || snapshot.size < 500) break;
    cursor = snapshot.docs.at(-1);
  }
  if (records.length > maxDocuments) fail(`collection ${collection.path} exceeds --max-documents=${maxDocuments}; raise the reviewed bound explicitly`);
  return records;
}

async function loadCanonicalMemberships(collection, maxDocuments) {
  const records = [];
  let cursor = null;
  while (records.length <= maxDocuments) {
    let query = collection.orderBy(admin.firestore.FieldPath.documentId()).limit(Math.min(500, maxDocuments + 1 - records.length));
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    for (const document of snapshot.docs) records.push({path: document.ref.path, data: normalizeFirestoreDocument(document.data())});
    if (snapshot.size === 0 || snapshot.size < 500) break;
    cursor = snapshot.docs.at(-1);
  }
  if (records.length > maxDocuments) fail(`canonical membership inventory exceeds --max-documents=${maxDocuments}`);
  return records.filter((item) => /^studios\/[^/]+\/members\/[^/]+$/.test(item.path));
}

async function loadInventoryInTransaction(transaction, db, projectId, maxDocuments) {
  const limit = maxDocuments + 1;
  const [studiosSnapshot, membershipsSnapshot, canonicalSnapshot] = await Promise.all([
    transaction.get(db.collection('studios').orderBy(admin.firestore.FieldPath.documentId()).limit(limit)),
    transaction.get(db.collection('memberships').orderBy(admin.firestore.FieldPath.documentId()).limit(limit)),
    transaction.get(db.collectionGroup('members').orderBy(admin.firestore.FieldPath.documentId()).limit(limit)),
  ]);
  if (studiosSnapshot.size > maxDocuments || membershipsSnapshot.size > maxDocuments || canonicalSnapshot.size > maxDocuments) {
    fail(`live migration inventory exceeds --max-documents=${maxDocuments}; raise the reviewed bound explicitly`);
  }
  return {
    projectId,
    studios: studiosSnapshot.docs.map((document) => ({id: document.id, data: normalizeFirestoreDocument(document.data())})),
    legacyMemberships: membershipsSnapshot.docs.map((document) => ({id: document.id, data: normalizeFirestoreDocument(document.data())})),
    canonicalMemberships: canonicalSnapshot.docs
      .filter((document) => /^studios\/[^/]+\/members\/[^/]+$/.test(document.ref.path))
      .map((document) => ({path: document.ref.path, data: normalizeFirestoreDocument(document.data())})),
  };
}

function denormalize(value, db) {
  if (Array.isArray(value)) return value.map((item) => denormalize(item, db));
  if (value && typeof value === 'object') {
    const envelope = Object.keys(value).length === 1 && value.__uraiFirestoreValue && typeof value.__uraiFirestoreValue === 'object'
      ? value.__uraiFirestoreValue
      : null;
    if (envelope?.type === 'number' && envelope.value === 'NaN') return Number.NaN;
    if (envelope?.type === 'number' && envelope.value === 'Infinity') return Number.POSITIVE_INFINITY;
    if (envelope?.type === 'number' && envelope.value === '-Infinity') return Number.NEGATIVE_INFINITY;
    if (envelope?.type === 'timestamp' && typeof envelope.value === 'string') {
      const legacyDate = new Date(envelope.value);
      if (!Number.isNaN(legacyDate.getTime())) return admin.firestore.Timestamp.fromDate(legacyDate);
    }
    if (envelope?.type === 'timestamp' && Number.isInteger(envelope.value?.seconds) && Number.isInteger(envelope.value?.nanoseconds)) {
      return new admin.firestore.Timestamp(envelope.value.seconds, envelope.value.nanoseconds);
    }
    if (envelope?.type === 'reference' && typeof envelope.value === 'string') return db.doc(envelope.value);
    if (envelope?.type === 'geoPoint' && typeof envelope.value?.latitude === 'number' && typeof envelope.value?.longitude === 'number') {
      return new admin.firestore.GeoPoint(envelope.value.latitude, envelope.value.longitude);
    }
    if (envelope?.type === 'bytes' && typeof envelope.value === 'string') return Buffer.from(envelope.value, 'base64');
    if (envelope?.type === 'vector' && Array.isArray(envelope.value)) {
      const components = envelope.value.map((item) => denormalize(item, db));
      if (components.every((item) => typeof item === 'number')) return new admin.firestore.VectorValue(components);
    }
    if (envelope?.type === 'map' && envelope.value && typeof envelope.value === 'object' && !Array.isArray(envelope.value)) {
      return Object.fromEntries(Object.entries(envelope.value).map(([key, item]) => [key, denormalize(item, db)]));
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, denormalize(item, db)]));
  }
  return value;
}

function receiptOrFail(options) {
  const receipt = readJson(options.receipt, 'receipt');
  const result = validateReceipt(receipt);
  if (!result.ok) fail(`invalid migration receipt:\n- ${result.errors.join('\n- ')}`);
  return receipt;
}

async function plan(options) {
  const projectId = requireProject(options);
  const manifest = readJson(options.manifest, 'manifest');
  const receiptPath = options.receipt;
  if (!receiptPath) fail('--receipt is required');
  if (fs.existsSync(path.resolve(receiptPath))) fail('refusing to overwrite an existing receipt');
  const maxDocuments = requireMaxDocuments(options);
  const db = initialize(projectId);
  const [studios, legacyMemberships, canonicalMemberships] = await Promise.all([
    loadCollection(db.collection('studios'), maxDocuments),
    loadCollection(db.collection('memberships'), maxDocuments),
    loadCanonicalMemberships(db.collectionGroup('members'), maxDocuments),
  ]);
  const inventory = {
    projectId,
    studios,
    legacyMemberships,
    canonicalMemberships,
  };
  const validation = validateAuthorityManifest(manifest, inventory, projectId);
  if (!validation.ok) fail(`authority manifest does not close the inventory:\n- ${validation.errors.join('\n- ')}`);
  const canonicalBefore = inventory.canonicalMemberships;
  const receipt = buildMigrationPlan({manifest, inventory, canonicalBefore, generatedAt: new Date().toISOString()});
  writePrivateJson(receiptPath, receipt);
  return {ok: true, command: 'plan', status: receipt.status, projectId, planDigest: receipt.planDigest, acceptedMembershipCount: receipt.acceptedMembershipCount, rejectedLegacyMembershipCount: receipt.rejectedLegacyMembershipCount, rejectedStudioCount: receipt.rejectedStudioCount, receipt: path.resolve(receiptPath)};
}

async function apply(options) {
  const projectId = requireProject(options, 'confirm-project');
  const receipt = receiptOrFail(options);
  const manifest = readJson(options.manifest, 'manifest');
  if (receipt.projectId !== projectId || manifest.projectId !== projectId) fail('project confirmation, manifest, and receipt do not match');
  if (sha256(manifest) !== receipt.manifestHash) fail('manifest changed after the plan was created');
  if (receipt.status !== 'planned') fail(`apply requires a planned receipt, got ${receipt.status}`);
  const maxDocuments = requireMaxDocuments(options);
  const db = initialize(projectId);
  const migrationRef = db.collection('studioMembershipMigrations').doc(receipt.planDigest);
  const refs = receipt.operations.map((operation) => db.doc(operation.path));

  const existingMigration = await migrationRef.get();
  if (existingMigration.exists) {
    const data = existingMigration.data();
    if (data?.planDigest !== receipt.planDigest || data?.status !== 'applied') fail('a conflicting migration record already exists');
    const recovered = {...receipt, status: 'applied', appliedAt: normalizeFirestoreValue(data.appliedAt) ?? new Date().toISOString()};
    writePrivateJson(options.receipt, recovered);
    return {ok: true, command: 'apply', status: 'applied', recoveredReceipt: true, projectId, planDigest: receipt.planDigest};
  }

  await db.runTransaction(async (transaction) => {
    const [migrationSnapshot, liveInventory, ...snapshots] = await Promise.all([
      transaction.get(migrationRef),
      loadInventoryInTransaction(transaction, db, projectId, maxDocuments),
      ...refs.map((ref) => transaction.get(ref)),
    ]);
    if (migrationSnapshot.exists) fail('migration record appeared during apply');
    if (sha256(liveInventory) !== receipt.inventoryHash) {
      fail('Studio or legacy-membership inventory changed after planning; create and approve a new plan');
    }
    for (let index = 0; index < receipt.operations.length; index += 1) {
      const current = snapshots[index].exists ? normalizeFirestoreDocument(snapshots[index].data()) : null;
      if (sha256(current) !== receipt.operations[index].beforeHash) fail(`canonical membership changed after planning: ${receipt.operations[index].path}`);
    }
    for (let index = 0; index < receipt.operations.length; index += 1) {
      const after = receipt.operations[index].after;
      if (after === null) transaction.delete(refs[index]);
      else transaction.set(refs[index], denormalize(after, db));
    }
    transaction.create(migrationRef, {
      status: 'applied',
      projectId,
      planDigest: receipt.planDigest,
      manifestHash: receipt.manifestHash,
      inventoryHash: receipt.inventoryHash,
      approvedBy: receipt.approvedBy,
      approvalEvidenceRef: receipt.approvalEvidenceRef,
      acceptedMembershipCount: receipt.acceptedMembershipCount,
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  const applied = {...receipt, status: 'applied', appliedAt: new Date().toISOString()};
  writePrivateJson(options.receipt, applied);
  return {ok: true, command: 'apply', status: 'applied', recoveredReceipt: false, projectId, planDigest: receipt.planDigest, acceptedMembershipCount: receipt.acceptedMembershipCount};
}

async function verify(options) {
  const projectId = requireProject(options, 'confirm-project');
  const receipt = receiptOrFail(options);
  if (receipt.projectId !== projectId || !['applied', 'verified'].includes(receipt.status)) fail('verify requires an applied receipt for the confirmed project');
  const db = initialize(projectId);
  const refs = receipt.operations.map((operation) => db.doc(operation.path));
  const snapshots = await db.getAll(...refs);
  for (let index = 0; index < receipt.operations.length; index += 1) {
    const current = snapshots[index].exists ? normalizeFirestoreDocument(snapshots[index].data()) : null;
    if (sha256(current) !== receipt.operations[index].afterHash) fail(`verification mismatch: ${receipt.operations[index].path}`);
  }
  const verified = {...receipt, status: 'verified', verifiedAt: new Date().toISOString()};
  writePrivateJson(options.receipt, verified);
  return {ok: true, command: 'verify', status: 'verified', projectId, planDigest: receipt.planDigest, verifiedMembershipCount: receipt.operations.length};
}

async function rollback(options) {
  const projectId = requireProject(options, 'confirm-project');
  const receipt = receiptOrFail(options);
  if (receipt.projectId !== projectId || !['applied', 'verified'].includes(receipt.status)) fail('rollback requires an applied or verified receipt for the confirmed project');
  if (!options['approved-by']?.trim() || !options['approval-evidence-ref']?.trim()) fail('rollback requires --approved-by and --approval-evidence-ref from the real rollback authority');
  const db = initialize(projectId);
  const migrationRef = db.collection('studioMembershipMigrations').doc(receipt.planDigest);
  const refs = receipt.operations.map((operation) => db.doc(operation.path));
  await db.runTransaction(async (transaction) => {
    const [migrationSnapshot, ...snapshots] = await Promise.all([
      transaction.get(migrationRef),
      ...refs.map((ref) => transaction.get(ref)),
    ]);
    if (!migrationSnapshot.exists || migrationSnapshot.data()?.planDigest !== receipt.planDigest) fail('matching applied migration record is missing');
    for (let index = 0; index < receipt.operations.length; index += 1) {
      const current = snapshots[index].exists ? normalizeFirestoreDocument(snapshots[index].data()) : null;
      if (sha256(current) !== receipt.operations[index].afterHash) fail(`rollback blocked by post-migration change: ${receipt.operations[index].path}`);
    }
    for (let index = 0; index < receipt.operations.length; index += 1) {
      const before = receipt.operations[index].before;
      if (before === null) transaction.delete(refs[index]);
      else transaction.set(refs[index], denormalize(before, db));
    }
    transaction.update(migrationRef, {
      status: 'rolled_back',
      rollbackApprovedBy: options['approved-by'],
      rollbackApprovalEvidenceRef: options['approval-evidence-ref'],
      rolledBackAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  const rolledBack = {...receipt, status: 'rolled_back', rolledBackAt: new Date().toISOString()};
  writePrivateJson(options.receipt, rolledBack);
  return {ok: true, command: 'rollback', status: 'rolled_back', projectId, planDigest: receipt.planDigest, restoredMembershipCount: receipt.operations.length};
}

const {command, options} = parseArgs(process.argv.slice(2));
const handlers = {plan, apply, verify, rollback};
if (!handlers[command]) fail('usage: studio-membership-migration.mjs <plan|apply|verify|rollback> [options]');

try {
  const result = await handlers[command](options);
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
