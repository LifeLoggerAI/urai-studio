import assert from 'node:assert/strict';
import fs from 'node:fs';

const rules = fs.readFileSync(new URL('../../../firestore.rules', import.meta.url), 'utf8');
const contactRoute = fs.readFileSync(new URL('../app/api/contact/route.ts', import.meta.url), 'utf8');
const waitlistRoute = fs.readFileSync(new URL('../app/api/waitlist/route.ts', import.meta.url), 'utf8');

const lockedCollections = [
  'waitlist',
  'contactMessages',
  'contactRequests',
  'projectRequests',
  'integrationRequests',
];

for (const collection of lockedCollections) {
  const token = `match /${collection}/{id}`;
  const start = rules.indexOf(token);
  assert.ok(start >= 0, `missing Firestore rule for ${collection}`);
  const block = rules.slice(start, start + 180);
  assert.ok(block.includes('allow read, write: if false;'), `${collection} must deny direct client access`);
}

for (const collection of ['contactRequests', 'projectRequests', 'integrationRequests']) {
  assert.ok(contactRoute.includes(`collection('${collection}')`), `contact API must document/write ${collection}`);
}

assert.ok(waitlistRoute.includes("collection('waitlist')"), 'waitlist API must write waitlist');
assert.ok(contactRoute.includes('website'), 'contact API must include honeypot field handling');
assert.ok(waitlistRoute.includes('website'), 'waitlist API must include honeypot field handling');
assert.ok(contactRoute.includes('invalid_json'), 'contact API must reject invalid JSON');
assert.ok(waitlistRoute.includes('invalid_json'), 'waitlist API must reject invalid JSON');

console.log('public submission security coverage passed');
