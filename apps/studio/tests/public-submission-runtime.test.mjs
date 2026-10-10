import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');

function loadSource(path, adminDb = null) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const fixtureModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: fixtureModule,
    exports: fixtureModule.exports,
    require: (name) => name === '@/lib/firebase-admin' ? { adminDb } : require(name),
    process: { env: { NODE_ENV: 'production' } },
  });
  return fixtureModule.exports;
}

function makeDatabase({ failCommit = false, failQuery = false, failWrite = false, duplicate = false } = {}) {
  const published = [];
  const pending = [];
  let commits = 0;
  let directWrites = 0;
  const db = {
    collection(name) {
      return {
        doc: () => ({ id: `${name}-receipt`, collection: name }),
        where: () => ({ limit: () => ({ get: async () => {
          if (failQuery) throw new Error('synthetic private query error');
          return { empty: !duplicate };
        } }) }),
        add: async (value) => {
          directWrites++;
          if (failWrite) throw new Error('synthetic private write error');
          published.push({ collection: name, value });
          return { id: `${name}-receipt` };
        },
      };
    },
    batch() {
      return {
        set(ref, value) { pending.push({ collection: ref.collection, value }); },
        async commit() {
          commits++;
          if (failCommit) throw new Error('synthetic private commit error');
          published.push(...pending);
        },
      };
    },
  };
  return { db, published, get commits() { return commits; }, get directWrites() { return directWrites; } };
}

const contactBody = { email: 'User@Example.test', useCase: 'Launch film', message: 'A sufficiently detailed project request.' };
const request = (body) => new Request('https://studio.example.test/api/submission', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});
const contactPath = '../app/api/contact/route.ts';
const waitlistPath = '../app/api/waitlist/route.ts';

const contactDb = makeDatabase();
const accepted = await loadSource(contactPath, contactDb.db).POST(request(contactBody));
const acceptedBody = await accepted.json();
assert.equal(accepted.status, 200);
assert.equal(acceptedBody.persisted, true);
assert.equal(contactDb.commits, 1);
assert.equal(contactDb.directWrites, 0, 'contact intake must publish all three records atomically');
assert.deepEqual(contactDb.published.map((entry) => entry.collection), ['contactRequests', 'projectRequests', 'integrationRequests']);
assert.equal(acceptedBody.data.contactRequestId, 'contactRequests-receipt');
assert.equal(contactDb.published[0].value.email, 'user@example.test');

const rejectedDb = makeDatabase({ failCommit: true });
const rejected = await loadSource(contactPath, rejectedDb.db).POST(request(contactBody));
const rejectedBody = await rejected.json();
assert.equal(rejected.status, 503);
assert.equal(rejectedBody.ok, false);
assert.equal(rejectedBody.persisted, false);
assert.equal(rejectedDb.published.length, 0);
assert.equal(JSON.stringify(rejectedBody).includes('synthetic private'), false, 'private SDK errors must not reach public responses');

for (const [body, expectedStatus] of [[{ ...contactBody, email: 'invalid' }, 400], [{ ...contactBody, website: 'bot' }, 400], [{ ...contactBody, message: 'short' }, 400]]) {
  const state = makeDatabase();
  const response = await loadSource(contactPath, state.db).POST(request(body));
  assert.equal(response.status, expectedStatus);
  assert.equal(state.published.length, 0);
  assert.equal(state.commits, 0);
}

for (const path of [contactPath, waitlistPath]) {
  const response = await loadSource(path).POST(request(contactBody));
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.persisted, false);
  assert.equal(body.ok, false);
}

for (const options of [{ failQuery: true }, { failWrite: true }]) {
  const state = makeDatabase(options);
  const response = await loadSource(waitlistPath, state.db).POST(request({ email: 'user@example.test' }));
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.persisted, false);
  assert.equal(body.error, 'persistence_failed');
  assert.equal(JSON.stringify(body).includes('synthetic private'), false);
}

for (const duplicate of [false, true]) {
  const state = makeDatabase({ duplicate });
  const response = await loadSource(waitlistPath, state.db).POST(request({ email: 'user@example.test' }));
  const body = await response.json();
  assert.equal(body.persisted, true);
  assert.equal(body.duplicate, duplicate);
  assert.equal(state.directWrites, duplicate ? 0 : 1);
}

const { readSubmissionResult } = loadSource('../lib/public-submission-response.ts');
assert.equal(readSubmissionResult(true, { ok: true, persisted: true }).saved, true);
for (const body of [null, [], 'invalid', {}, { ok: true }, { ok: true, persisted: false }, { ok: false, persisted: true }]) {
  const result = readSubmissionResult(true, body);
  assert.equal(result.saved, false, 'HTTP success alone must not clear a form or claim storage');
  assert.match(result.message, /could not confirm/);
}
assert.equal(readSubmissionResult(false, { ok: true, persisted: true }).saved, false);
assert.equal(readSubmissionResult(false, { error: { message: 'Please check your email.' } }).message, 'Please check your email.');
assert.equal(readSubmissionResult(true, { ok: true, persisted: false, message: 'Demo mode: not persisted.' }).message, 'Demo mode: not persisted.');

console.log('actual compiled public submission handlers: atomic publication, safe errors and receipt-based UI results passed');
