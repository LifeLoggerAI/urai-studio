/**
 * One UrAi Genesis R857: native Firebase Rules emulator security reproducer.
 * Review-only, synthetic documents, no production credentials or user media.
 * Mode "observed" records the candidate's behavior; mode "secure" is a
 * prospective negative gate and is EXPECTED TO FAIL until rights are repaired.
 * Source parent: Studio PR #179, 153d6c35557c66a8b9f8629778ca796b83730464.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

const projectId = 'demo-urai-studio-r857-job-boundary';
const mode = process.env.URAI_R857_EXPECTATION || 'observed';
assert.ok(['observed', 'secure'].includes(mode), 'invalid expectation');
function addr(raw, fallback) {
  const value = raw || fallback;
  assert.match(value, /^(?:localhost|127\.0\.0\.1):\d{4,5}$/, 'emulator loopback only');
  const [host, portText] = value.split(':');
  const port = Number(portText);
  assert.ok(port > 1023 && port <= 65535, 'invalid emulator port');
  return { host, port };
}
const firestore = addr(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18080');
const storage = addr(process.env.FIREBASE_STORAGE_EMULATOR_HOST, '127.0.0.1:19199');
let env;
const user = uid => env.authenticatedContext(uid);
const viewer = () => user('viewer-r857');
async function expectBoundary(operation) {
  return mode === 'secure' ? assertFails(operation) : assertSucceeds(operation);
}
before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { ...firestore, rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8') },
    storage: { ...storage, rules: await readFile(new URL('../../storage.rules', import.meta.url), 'utf8') },
  });
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async admin => {
    const db = admin.firestore();
    await setDoc(doc(db, 'studios/r857-studio'), { name: 'Synthetic review studio' });
    for (const [uid, role] of [['viewer-r857','viewer'],['creator-r857','creator'],['owner-r857','owner']]) {
      await setDoc(doc(db, 'memberships/' + uid + '_r857-studio'), { uid, studioId: 'r857-studio', role, createdAt: 1 });
    }
    await setDoc(doc(db, 'projects/foreign-project-r857'), { ownerUid: 'owner-r857' });
    await setDoc(doc(db, 'studioUsers/viewer-r857'), { uid: 'viewer-r857', role: 'viewer', disabled: false });
    for (const jobId of ['server-job-r857','creator-job-r857']) {
      await setDoc(doc(db, 'jobs/' + jobId), {
        studioId: 'r857-studio', createdBy: 'owner-r857', projectId: 'foreign-project-r857',
        kind: 'clip_render', state: 'queued', priority: 1,
      });
    }
  });
});
after(async () => {
  if (env) await env.cleanup();
  console.log('R857_SCOPE=' + projectId + ' mode=' + mode + ' syntheticOnly=true productionWrites=0');
});

test('viewer directly creates queued job referencing a different owner project', async () => {
  const payload = {
    studioId: 'r857-studio', projectId: 'foreign-project-r857', kind: 'clip_render',
    state: 'queued', priority: 99, createdBy: 'owner-r857',
  };
  await expectBoundary(setDoc(doc(viewer().firestore(), 'jobs/viewer-forged-job-r857'), payload));
  if (mode === 'observed') {
    const found = await getDoc(doc(viewer().firestore(), 'jobs/viewer-forged-job-r857'));
    assert.equal(found.data()?.createdBy, 'owner-r857');
  }
});

test('viewer updates another actor job with fabricated success/output', async () => {
  await expectBoundary(updateDoc(doc(viewer().firestore(), 'jobs/server-job-r857'), {
    state: 'succeeded', output: { readyForExternalUse: true, path: 'synthetic-forgery' },
    priority: 100, kind: 'publish',
  }));
});

test('creator changes originally server-owned creator/project metadata', async () => {
  await expectBoundary(updateDoc(doc(user('creator-r857').firestore(), 'jobs/creator-job-r857'), {
    createdBy: 'viewer-r857', projectId: 'another-project-r857', priority: 100,
  }));
});

test('viewer creates forged system audit log without signed server authority', async () => {
  await expectBoundary(setDoc(doc(viewer().firestore(), 'auditLogs/forged-r857'), {
    studioId: 'r857-studio', actorUid: 'system', action: 'synthetic_untrusted_release_approval',
    target: 'jobs/server-job-r857', provenance: 'UNTRUSTED_CLIENT_FIXTURE',
  }));
});

test('viewer writes under shared studio outputs despite read-only role', async () => {
  await expectBoundary(uploadBytes(ref(viewer().storage(), 'studios/r857-studio/outputs/client-forged-r857.txt'), new Uint8Array([82,56,53,55])));
});

test('nonmember is denied jobs admission and shared outputs', async () => {
  await assertFails(setDoc(doc(user('outsider-r857').firestore(), 'jobs/outsider-r857'), {
    studioId: 'r857-studio', projectId: 'foreign-project-r857', state: 'queued', kind: 'clip_render',
  }));
  await assertFails(uploadBytes(ref(user('outsider-r857').storage(), 'studios/r857-studio/outputs/outsider-r857.txt'), new Uint8Array([1])));
});

test('valid member is denied access to an unjoined tenant', async () => {
  await assertFails(setDoc(doc(viewer().firestore(), 'jobs/other-studio-r857'), {
    studioId: 'studio-not-joined', projectId: 'foreign-project-r857', state: 'queued', kind: 'clip_render',
  }));
  await assertFails(uploadBytes(ref(viewer().storage(), 'studios/studio-not-joined/outputs/other-r857.txt'), new Uint8Array([1])));
});

test('separate generated owner-media prefix denies client writes', async () => {
  await assertFails(uploadBytes(ref(viewer().storage(), 'generated/viewer-r857/studio/forged-r857.txt'), new Uint8Array([1])));
});
