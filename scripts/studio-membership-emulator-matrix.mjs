import assert from 'node:assert/strict'

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'urai-studio-ci'
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'
const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199'
const firestoreBase = `http://${firestoreHost}/v1/projects/${projectId}/databases/(default)/documents`
const storageBucket = `${projectId}.appspot.com`
const storageBase = `http://${storageHost}/v0/b/${storageBucket}/o`

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function emulatorToken(uid, extraClaims = {}) {
  const now = Math.floor(Date.now() / 1000)
  return `${base64url({alg: 'none', typ: 'JWT'})}.${base64url({
    aud: projectId,
    auth_time: now,
    exp: now + 3600,
    firebase: {identities: {}, sign_in_provider: 'custom'},
    iat: now,
    iss: `https://securetoken.google.com/${projectId}`,
    sub: uid,
    user_id: uid,
    ...extraClaims,
  })}.`
}

function firestoreValue(value) {
  if (value === null) return {nullValue: null}
  if (typeof value === 'string') return {stringValue: value}
  if (typeof value === 'boolean') return {booleanValue: value}
  if (typeof value === 'number') return Number.isInteger(value) ? {integerValue: String(value)} : {doubleValue: value}
  if (Array.isArray(value)) return {arrayValue: {values: value.map(firestoreValue)}}
  if (typeof value === 'object') return {mapValue: {fields: firestoreFields(value)}}
  throw new TypeError(`Unsupported Firestore value: ${typeof value}`)
}

function firestoreFields(record) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, firestoreValue(value)]))
}

async function request(url, {method = 'GET', token, body, headers = {}} = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...(body && typeof body !== 'string' && !(body instanceof Uint8Array) ? {'Content-Type': 'application/json'} : {}),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body),
  })
  const text = await response.text()
  return {status: response.status, text}
}

async function seedDocument(path, data) {
  const result = await request(`${firestoreBase}/${path}`, {
    method: 'PATCH',
    token: 'owner',
    body: {fields: firestoreFields(data)},
  })
  assert.ok(result.status >= 200 && result.status < 300, `seed ${path} failed: ${result.status} ${result.text}`)
}

async function clientRead(path, uid) {
  return request(`${firestoreBase}/${path}`, {token: emulatorToken(uid)})
}

async function clientWrite(path, uid, data) {
  return request(`${firestoreBase}/${path}`, {
    method: 'PATCH',
    token: emulatorToken(uid),
    body: {fields: firestoreFields(data)},
  })
}

function expectAllowed(result, label) {
  assert.ok(result.status >= 200 && result.status < 300, `${label} expected allow, got ${result.status}: ${result.text}`)
}

function expectDenied(result, label) {
  assert.ok(result.status === 401 || result.status === 403, `${label} expected deny, got ${result.status}: ${result.text}`)
}

async function seedFirestore() {
  await seedDocument('studios/studio_a', {studioId: 'studio_a', name: 'Studio A'})
  await seedDocument('studios/studio_b', {studioId: 'studio_b', name: 'Studio B'})

  await seedDocument('memberships/owner_a_studio_a', {uid: 'owner_a', studioId: 'studio_a', role: 'owner', status: 'active'})
  await seedDocument('memberships/admin_a_studio_a', {uid: 'admin_a', studioId: 'studio_a', role: 'admin', status: 'active'})
  await seedDocument('memberships/editor_a_studio_a', {uid: 'editor_a', studioId: 'studio_a', role: 'editor', status: 'active'})
  await seedDocument('memberships/viewer_a_studio_a', {uid: 'viewer_a', studioId: 'studio_a', role: 'viewer', status: 'active'})
  await seedDocument('memberships/suspended_a_studio_a', {uid: 'suspended_a', studioId: 'studio_a', role: 'editor', status: 'suspended'})
  await seedDocument('memberships/owner_b_studio_b', {uid: 'owner_b', studioId: 'studio_b', role: 'owner', status: 'active'})

  await seedDocument('jobs/job_a', {studioId: 'studio_a', kind: 'render', status: 'queued'})
  await seedDocument('jobs/job_b', {studioId: 'studio_b', kind: 'render', status: 'queued'})
  await seedDocument('jobRuns/run_a', {studioId: 'studio_a', jobId: 'job_a', status: 'running'})
}

async function runFirestoreMatrix() {
  expectAllowed(await clientRead('studios/studio_a', 'owner_a'), 'owner reads own studio')
  expectAllowed(await clientRead('studios/studio_a', 'viewer_a'), 'viewer reads own studio')
  expectDenied(await clientRead('studios/studio_b', 'owner_a'), 'owner cannot read another tenant')
  expectDenied(await clientRead('studios/studio_a', 'suspended_a'), 'suspended member cannot read')
  expectDenied(await clientRead('studios/studio_a', 'stranger'), 'non-member cannot read')

  expectDenied(await clientWrite('studios/studio_new', 'owner_a', {studioId: 'studio_new', name: 'Unauthorized'}), 'client cannot create Studio')
  expectDenied(await clientWrite('memberships/attacker_studio_a', 'attacker', {uid: 'attacker', studioId: 'studio_a', role: 'owner', status: 'active'}), 'client cannot self-grant membership')

  expectAllowed(await clientWrite('jobs/editor_job', 'editor_a', {studioId: 'studio_a', kind: 'render', status: 'queued'}), 'editor creates own-tenant job')
  expectDenied(await clientWrite('jobs/viewer_job', 'viewer_a', {studioId: 'studio_a', kind: 'render', status: 'queued'}), 'viewer cannot create job')
  expectDenied(await clientWrite('jobs/cross_job', 'editor_a', {studioId: 'studio_b', kind: 'render', status: 'queued'}), 'editor cannot create cross-tenant job')
  expectDenied(await clientWrite('jobs/job_a', 'editor_a', {studioId: 'studio_b', kind: 'render', status: 'queued'}), 'studioId is immutable on update')

  expectAllowed(await clientRead('jobRuns/run_a', 'viewer_a'), 'active member reads worker lifecycle')
  expectDenied(await clientWrite('jobRuns/client_run', 'owner_a', {studioId: 'studio_a', jobId: 'job_a', status: 'running'}), 'client cannot impersonate worker')
  expectDenied(await clientRead('jobs/job_b', 'owner_a'), 'tenant A cannot read tenant B job')
}

async function uploadObject(path, uid, body = 'test') {
  return request(`${storageBase}?uploadType=media&name=${encodeURIComponent(path)}`, {
    method: 'POST',
    token: uid === 'owner' ? 'owner' : emulatorToken(uid),
    body,
    headers: {'Content-Type': 'text/plain'},
  })
}

async function downloadObject(path, uid) {
  return request(`${storageBase}/${encodeURIComponent(path)}?alt=media`, {
    token: emulatorToken(uid),
  })
}

async function runStorageMatrix() {
  expectAllowed(await uploadObject('studios/studio_a/uploads/editor.txt', 'editor_a'), 'editor uploads to own Studio')
  expectDenied(await uploadObject('studios/studio_a/uploads/viewer.txt', 'viewer_a'), 'viewer cannot upload')
  expectDenied(await uploadObject('studios/studio_b/uploads/cross.txt', 'editor_a'), 'editor cannot upload cross-tenant')
  expectDenied(await uploadObject('studios/studio_a/uploads/suspended.txt', 'suspended_a'), 'suspended member cannot upload')

  expectAllowed(await uploadObject('studios/studio_a/outputs/server.txt', 'owner', 'server-output'), 'admin seed output')
  expectAllowed(await downloadObject('studios/studio_a/outputs/server.txt', 'viewer_a'), 'active viewer reads generated output')
  expectDenied(await downloadObject('studios/studio_a/outputs/server.txt', 'owner_b'), 'other tenant cannot read generated output')
  expectDenied(await uploadObject('studios/studio_a/outputs/client.txt', 'owner_a'), 'client cannot write generated output')
}

await seedFirestore()
await runFirestoreMatrix()
await runStorageMatrix()

console.log('PASS Studio membership Firestore and Storage emulator matrix')
