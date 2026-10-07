import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

// This command can only address the isolated demo emulator estate. The
// canonical receipt is a synthetic server fixture, never production authority.
const projectId = 'demo-urai-studio';
for (const [name, expected] of Object.entries({ FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:19097',
  FIRESTORE_EMULATOR_HOST:'127.0.0.1:18078', FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:19197' })) {
  assert.equal(process.env[name], expected, `${name} must address the isolated demo emulator`);
}
assert.equal(process.env.GCLOUD_PROJECT, projectId);
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = require('firebase-admin');
const app = admin.initializeApp({ projectId, storageBucket:`${projectId}.appspot.com` }, 'studio-synthetic-rights-proof');
const db = app.firestore(), authBase = 'http://127.0.0.1:19097', functionsBase = `http://127.0.0.1:15003/${projectId}/us-central1`;
const signup = await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=synthetic-emulator-key`, {
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true}) });
assert.equal(signup.status,200);const {localId:uid,idToken} = await signup.json();assert.ok(uid && idToken);
const receiptHash = createHash('sha256').update('synthetic-studio-emulator-C7-fixture-only').digest('hex');
const expiresAt = new Date(Date.now()+60*60*1000).toISOString();
await db.doc(`consentRecords/${uid}_data_export`).set({uid,purpose:'data.export',consentTier:'C7',status:'granted',
  policyVersion:'1.0.0',receiptHash,expiresAt,fixtureOnly:true});
await db.doc(`privacyDeletionTombstones/${uid}`).set({uid,active:false,exportConsentStatus:'granted',exportConsentPolicyVersion:'1.0.0',
  exportConsentReceiptHash:receiptHash,exportConsentExpiresAt:expiresAt,fixtureOnly:true});
await db.doc(`users/${uid}`).set({uid,syntheticFixtureOnly:true,payload:'Synthetic bounded account export'});
async function call(name,data) {
  const response=await fetch(`${functionsBase}/${name}`,{method:'POST',headers:{Authorization:`Bearer ${idToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({data}),redirect:'error',signal:AbortSignal.timeout(30_000)});
  assert.equal(response.status,200,`actual callable ${name} failed`);const value=await response.json();assert.ok(value.result);return value.result;
}
const created=await call('requestStudioDataExport',{}), descriptor=await call('getStudioDataExportDownload',{requestId:created.requestId});
assert.equal(descriptor.requiresAuthorization,true);
const endpoint=new URL(descriptor.url);assert.equal(endpoint.origin,'http://127.0.0.1:15003');
assert.equal(endpoint.pathname,`/${projectId}/us-central1/downloadStudioDataExport`);
const studioOrigin='https://www.uraistudio.com';
const preflight=await fetch(descriptor.url,{method:'OPTIONS',headers:{Origin:studioOrigin,
  'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'Authorization'},redirect:'error'});
assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),studioOrigin);
assert.equal(preflight.headers.get('access-control-allow-headers'),'Authorization');
assert.equal(preflight.headers.get('access-control-allow-credentials'),null);
const foreignOrigin=await fetch(descriptor.url,{headers:{Origin:'https://foreign.example',Authorization:`Bearer ${idToken}`},redirect:'error'});
assert.equal(foreignOrigin.status,403);assert.equal(foreignOrigin.headers.get('access-control-allow-origin'),null);
const bytes=await fetch(descriptor.url,{headers:{Origin:studioOrigin,Authorization:`Bearer ${idToken}`},redirect:'error',signal:AbortSignal.timeout(30_000)});
assert.equal(bytes.status,200);assert.match(bytes.headers.get('cache-control'),/no-store/);
assert.equal(bytes.headers.get('access-control-allow-origin'),studioOrigin);
const body=Buffer.from(await bytes.arrayBuffer());assert.equal(createHash('sha256').update(body).digest('hex'),descriptor.checksum);
assert.equal(JSON.parse(body).kind,'export');
assert.equal((await fetch(descriptor.url,{redirect:'error'})).status,401);
const record=(await db.doc(`studioDataRightsRequests/${created.requestId}`).get()).data();
const direct=await fetch(`http://127.0.0.1:19197/v0/b/${projectId}.appspot.com/o/${encodeURIComponent(record.packageReceipt.objectPath)}?alt=media`,
  {headers:{Authorization:`Firebase ${idToken}`},redirect:'error'});
assert.equal(direct.status,403,'direct owner Storage download must be denied by the deployed emulator rules');
await db.runTransaction(async transaction=>{
  transaction.update(db.doc(`consentRecords/${uid}_data_export`),{status:'revoked'});
  transaction.update(db.doc(`privacyDeletionTombstones/${uid}`),{exportConsentStatus:'revoked'});
});
const withdrawn=await fetch(descriptor.url,{headers:{Authorization:`Bearer ${idToken}`},redirect:'error'});
assert.equal(withdrawn.status,409);assert.deepEqual(await withdrawn.json(),{error:'studio_export_download_unavailable'});
console.log(JSON.stringify({schemaVersion:'urai-studio-loaded-export-emulator-v1',exactSourceSha:process.env.URAI_EXACT_HEAD,
  actualCallableCreator:true,actualCallableDescriptor:true,actualHttpBytes:true,checksumVerified:true,
  actualBearerPreflight:true,foreignOriginDenied:true,
  unauthenticatedBytesDenied:true,directOwnerStorageReadDenied:true,reusedDescriptorAfterWithdrawalDenied:true,
  canonicalFixtureOnly:true,providerCalls:0,spendAuthorized:false,productionExecutionClaimed:false}));
await app.delete();
