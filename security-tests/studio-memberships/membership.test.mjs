import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, deleteField } from 'firebase/firestore';
import { ref, getBytes, uploadBytes, deleteObject } from 'firebase/storage';

const projectId = 'demo-urai-studio-memberships';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:18080';
const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:19199';
const address = (value) => { const [host, port] = value.split(':'); return { host, port: Number(port) }; };
let env;
const ctx = (uid) => uid ? env.authenticatedContext(uid) : env.unauthenticatedContext();
const member = (uid, studioId = 'studio-a', role = 'creator') => ({ uid, studioId, role, createdAt: 1 });
const collections = ['clipRequests', 'jobs', 'jobRuns', 'assets', 'outputs', 'deadLetters', 'auditLogs'];
const malformed = {
  'wrong-uid': { uid: 'somebody-else', studioId: 'studio-a', role: 'owner' },
  'wrong-studio': { uid: 'wrong-studio', studioId: 'studio-b', role: 'owner' },
  'no-uid': { studioId: 'studio-a', role: 'owner' },
  'no-studio': { uid: 'no-studio', role: 'owner' },
  'no-role': { uid: 'no-role', studioId: 'studio-a' },
  'arbitrary-role': { uid: 'arbitrary-role', studioId: 'studio-a', role: 'admin' },
};

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { ...address(firestoreHost), rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8') },
    storage: { ...address(storageHost), rules: await readFile(new URL('../../storage.rules', import.meta.url), 'utf8') },
  });
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (admin) => {
    const db = admin.firestore();
    await setDoc(doc(db, 'studios/studio-a'), { name: 'A' });
    await setDoc(doc(db, 'studios/studio-b'), { name: 'B' });
    for (const role of ['owner', 'creator', 'viewer']) {
      const uid = role + '-a';
      await setDoc(doc(db, `memberships/${uid}_studio-a`), member(uid, 'studio-a', role));
    }
    await setDoc(doc(db, 'memberships/member-b_studio-b'), member('member-b', 'studio-b'));
    await setDoc(doc(db, 'memberships/revocable_studio-a'), member('revocable'));
    await setDoc(doc(db, 'memberships/prefix_other_studio-a'), member('prefix_other'));
    for (const [uid, data] of Object.entries(malformed)) {
      await setDoc(doc(db, `memberships/${uid}_studio-a`), data);
    }
    for (const collection of collections) {
      await setDoc(doc(db, `${collection}/a`), { studioId: 'studio-a', value: 'private-a' });
      await setDoc(doc(db, `${collection}/b`), { studioId: 'studio-b', value: 'private-b' });
    }
    // The callable bootstrap uses Admin and this separate server-owned collection.
    await setDoc(doc(db, 'studioUsers/bootstrap-owner'), { uid: 'bootstrap-owner', role: 'owner', disabled: false });
    for (const path of ['studios/studio-a/uploads/source.txt', 'studios/studio-a/outputs/movie.txt',
      'user-uploads/creator-a/studio/private.txt', 'generated/creator-a/studio/movie.txt', 'public/studio-assets/public.txt']) {
      await uploadBytes(ref(admin.storage(), path), new Uint8Array([65, 66, 67]));
    }
  });
});

after(async () => { if (env) await env.cleanup(); });

test('unauthenticated client cannot create a membership', async () => {
  await assertFails(setDoc(doc(ctx().firestore(), 'memberships/anonymous_studio-a'), member('anonymous', 'studio-a', 'owner')));
});
test('signed-in nonmember cannot create an arbitrary self-owner membership', async () => {
  await assertFails(setDoc(doc(ctx('outsider').firestore(), 'memberships/outsider_studio-a'), member('outsider', 'studio-a', 'owner')));
});
test('signed-in client cannot create a membership for another UID', async () => {
  await assertFails(setDoc(doc(ctx('outsider').firestore(), 'memberships/victim_studio-a'), member('victim', 'studio-a', 'owner')));
});
for (const role of ['owner', 'creator', 'viewer']) {
  test(`${role} cannot create a membership even in their own studio`, async () => {
    await assertFails(setDoc(doc(ctx(role + '-a').firestore(), `memberships/new-${role}_studio-a`), member('new-' + role)));
  });
}
test('creator cannot escalate their role to owner', async () => {
  await assertFails(updateDoc(doc(ctx('creator-a').firestore(), 'memberships/creator-a_studio-a'), { role: 'owner' }));
  assert.equal((await getDoc(doc(ctx('creator-a').firestore(), 'memberships/creator-a_studio-a'))).data().role, 'creator');
});
test('owner cannot rewrite or delete their own membership authority', async () => {
  const membership = doc(ctx('owner-a').firestore(), 'memberships/owner-a_studio-a');
  await assertFails(updateDoc(membership, { studioId: 'studio-b' }));
  await assertFails(deleteDoc(membership));
});
test('member cannot read another user membership', async () => {
  await assertFails(getDoc(doc(ctx('creator-a').firestore(), 'memberships/viewer-a_studio-a')));
});
test('UID prefix collision does not allow another user membership read', async () => {
  await assertFails(getDoc(doc(ctx('prefix').firestore(), 'memberships/prefix_other_studio-a')));
});
for (const [uid] of Object.entries(malformed)) {
  test(`malformed ${uid} membership grants neither document nor storage access`, async () => {
    await assertFails(getDoc(doc(ctx(uid).firestore(), 'studios/studio-a')));
    await assertFails(getDoc(doc(ctx(uid).firestore(), `memberships/${uid}_studio-a`)));
    await assertFails(getBytes(ref(ctx(uid).storage(), 'studios/studio-a/uploads/source.txt')));
    await assertFails(uploadBytes(ref(ctx(uid).storage(), `studios/studio-a/outputs/${uid}.txt`), new Uint8Array([1])));
  });
}
for (const collection of collections) {
  test(`${collection} rejects unauthenticated and cross-tenant reads`, async () => {
    await assertFails(getDoc(doc(ctx().firestore(), `${collection}/a`)));
    await assertFails(getDoc(doc(ctx('outsider').firestore(), `${collection}/a`)));
    await assertFails(getDoc(doc(ctx('member-b').firestore(), `${collection}/a`)));
    await assertSucceeds(getDoc(doc(ctx('creator-a').firestore(), `${collection}/a`)));
  });
}
for (const role of ['owner', 'creator', 'viewer']) {
  test(`valid ${role} retains their membership, studio, uploads and outputs access`, async () => {
    const uid = role + '-a';
    await assertSucceeds(getDoc(doc(ctx(uid).firestore(), `memberships/${uid}_studio-a`)));
    await assertSucceeds(getDoc(doc(ctx(uid).firestore(), 'studios/studio-a')));
    for (const kind of ['uploads', 'outputs']) {
      await assertSucceeds(getBytes(ref(ctx(uid).storage(), `studios/studio-a/${kind}/${kind === 'uploads' ? 'source' : 'movie'}.txt`)));
      const path = ref(ctx(uid).storage(), `studios/studio-a/${kind}/compatible-${role}.txt`);
      await assertSucceeds(uploadBytes(path, new Uint8Array([1, 2])));
      await assertSucceeds(deleteObject(path));
    }
  });
}
test('legitimate owner can update their studio; creator cannot claim owner powers', async () => {
  await assertSucceeds(updateDoc(doc(ctx('owner-a').firestore(), 'studios/studio-a'), { name: 'Owner edit' }));
  await assertFails(updateDoc(doc(ctx('creator-a').firestore(), 'studios/studio-a'), { name: 'Escalation' }));
});
for (const collection of ['clipRequests', 'jobs', 'jobRuns', 'assets', 'outputs', 'deadLetters']) {
  test(`${collection} updates require the existing tenant and cannot change or remove studioId`, async () => {
    const db = ctx('creator-a').firestore();
    const own = doc(db, `${collection}/a`);
    const other = doc(db, `${collection}/b`);
    await assertFails(updateDoc(other, { studioId: 'studio-a', value: 'overwrite-b' }));
    await assertFails(setDoc(other, { studioId: 'studio-a', value: 'replace-b' }));
    await assertFails(updateDoc(own, { studioId: 'studio-b' }));
    await assertFails(updateDoc(own, { studioId: deleteField() }));
    await assertSucceeds(updateDoc(own, { value: 'compatible-edit' }));
    const result = (await getDoc(own)).data();
    assert.equal(result.studioId, 'studio-a');
    assert.equal(result.value, 'compatible-edit');
  });
}
for (const kind of ['uploads', 'outputs']) {
  for (const uid of [null, 'outsider', 'member-b']) {
    test(`${kind} rejects ${uid ?? 'unauthenticated'} storage read, create and delete`, async () => {
      await assertFails(getBytes(ref(ctx(uid).storage(), `studios/studio-a/${kind}/${kind === 'uploads' ? 'source' : 'movie'}.txt`)));
      await assertFails(uploadBytes(ref(ctx(uid).storage(), `studios/studio-a/${kind}/forged-${uid}.txt`), new Uint8Array([1])));
      await assertFails(deleteObject(ref(ctx(uid).storage(), `studios/studio-a/${kind}/${kind === 'uploads' ? 'source' : 'movie'}.txt`)));
    });
  }
}
test('client cannot create or change the separate server-owned studioUsers bootstrap authority', async () => {
  const db = ctx('bootstrap-owner').firestore();
  await assertFails(getDoc(doc(db, 'studioUsers/bootstrap-owner')));
  await assertFails(updateDoc(doc(db, 'studioUsers/bootstrap-owner'), { role: 'admin' }));
  await assertFails(setDoc(doc(ctx('outsider').firestore(), 'studioUsers/outsider'), { uid: 'outsider', role: 'owner' }));
  // studioUsers is not a fallback grant for tenant memberships.
  await assertFails(getDoc(doc(db, 'studios/studio-a')));
  await env.withSecurityRulesDisabled(async (admin) => {
    assert.equal((await getDoc(doc(admin.firestore(), 'studioUsers/bootstrap-owner'))).data().role, 'owner');
  });
});
test('existing self-owned upload, server-generated read and public asset policies remain compatible', async () => {
  const storage = ctx('creator-a').storage();
  await assertSucceeds(getBytes(ref(storage, 'user-uploads/creator-a/studio/private.txt')));
  await assertSucceeds(uploadBytes(ref(storage, 'user-uploads/creator-a/studio/new.txt'), new Uint8Array([1])));
  await assertFails(getBytes(ref(ctx('member-b').storage(), 'user-uploads/creator-a/studio/private.txt')));
  await assertSucceeds(getBytes(ref(storage, 'generated/creator-a/studio/movie.txt')));
  await assertFails(uploadBytes(ref(storage, 'generated/creator-a/studio/new.txt'), new Uint8Array([1])));
  await assertSucceeds(getBytes(ref(ctx().storage(), 'public/studio-assets/public.txt')));
  await assertFails(uploadBytes(ref(ctx('creator-a').storage(), 'public/studio-assets/new.txt'), new Uint8Array([1])));
});
test('trusted-server membership removal revokes subsequent document and Storage access', async () => {
  await assertSucceeds(getDoc(doc(ctx('revocable').firestore(), 'studios/studio-a')));
  await assertSucceeds(getBytes(ref(ctx('revocable').storage(), 'studios/studio-a/uploads/source.txt')));
  await env.withSecurityRulesDisabled(async (admin) => {
    await deleteDoc(doc(admin.firestore(), 'memberships/revocable_studio-a'));
  });
  await assertFails(getDoc(doc(ctx('revocable').firestore(), 'studios/studio-a')));
  await assertFails(getBytes(ref(ctx('revocable').storage(), 'studios/studio-a/uploads/source.txt')));
});

const ownerFenceId = uid => createHash('sha256').update(`urai-studio-data-rights:${uid}`).digest('hex');
for (const state of ['active', 'permanent']) test(`self-owned upload ${state} fence blocks create, replacement and delete`, async () => {
  const uid = `synthetic-storage-${state}-fence`, path = `user-uploads/${uid}/studio/original.txt`;
  await env.withSecurityRulesDisabled(async admin => {
    await uploadBytes(ref(admin.storage(), path), new Uint8Array([65, 66, 67]));
    await setDoc(doc(admin.firestore(), `studioDataRightsOwnerFences/${ownerFenceId(uid)}`), {
      uid, requestId: 'synthetic-original-deletion-request', active: state === 'active', permanent: state === 'permanent',
    });
  });
  const own = ctx(uid).storage();
  await assertSucceeds(getBytes(ref(own, path)));
  await assertFails(uploadBytes(ref(own, `user-uploads/${uid}/studio/forbidden-new.txt`), new Uint8Array([1])));
  await assertFails(uploadBytes(ref(own, path), new Uint8Array([1])));
  await assertFails(deleteObject(ref(own, path)));
  await env.withSecurityRulesDisabled(async admin => assert.deepEqual(Array.from(await getBytes(ref(admin.storage(), path))), [65, 66, 67]));
});
test('cancelled nonpermanent owner fence retains compatible self-owned upload writes', async () => {
  const uid = 'synthetic-storage-cancelled-fence';
  await env.withSecurityRulesDisabled(async admin => setDoc(doc(admin.firestore(), `studioDataRightsOwnerFences/${ownerFenceId(uid)}`), {
    uid, requestId: 'synthetic-original-deletion-request', active: false, permanent: false,
  }));
  const path = ref(ctx(uid).storage(), `user-uploads/${uid}/studio/compatible.txt`);
  await assertSucceeds(uploadBytes(path, new Uint8Array([1])));
  await assertSucceeds(deleteObject(path));
});
test('canonical active privacy marker defeats an inactive Studio upload fence', async () => {
  const uid = 'synthetic-storage-canonical-deletion';
  await env.withSecurityRulesDisabled(async admin => {
    await setDoc(doc(admin.firestore(), `studioDataRightsOwnerFences/${ownerFenceId(uid)}`), {
      uid, requestId: 'synthetic-original-deletion-request', active: false, permanent: false,
    });
    await setDoc(doc(admin.firestore(), `privacyDeletionTombstones/${uid}`), { uid, active: true });
  });
  await assertFails(uploadBytes(ref(ctx(uid).storage(), `user-uploads/${uid}/studio/forbidden-new.txt`), new Uint8Array([1])));
});
