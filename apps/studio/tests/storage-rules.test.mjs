import assert from 'node:assert/strict';
import fs from 'node:fs';

const rules = fs.readFileSync(new URL('../../../storage.rules', import.meta.url), 'utf8');

for (const pathToken of [
  'studios/{studioId}/uploads',
  'studios/{studioId}/outputs',
  'user-uploads/{uid}/studio',
  'generated/{uid}/studio',
  'public/studio-assets',
]) {
  assert.ok(rules.includes(pathToken), `missing Storage path ${pathToken}`);
}

assert.ok(rules.includes('request.auth.uid == uid'), 'user uploads must be owner scoped');
assert.ok(rules.includes('isStudioMember(studioId)'), 'studio paths must be membership scoped');
assert.ok(rules.includes('allow write: if false;'), 'generated/public write paths must be denied');

const generatedStart = rules.indexOf('match /generated/{uid}/studio');
assert.ok(generatedStart >= 0, 'generated path must exist');
assert.ok(rules.slice(generatedStart, generatedStart + 220).includes('allow write: if false;'), 'generated files must not be client-writable');

const publicStart = rules.indexOf('match /public/studio-assets');
assert.ok(publicStart >= 0, 'public assets path must exist');
assert.ok(rules.slice(publicStart, publicStart + 220).includes('allow write: if false;'), 'public assets must not be client-writable');

console.log('storage rules security coverage passed');
