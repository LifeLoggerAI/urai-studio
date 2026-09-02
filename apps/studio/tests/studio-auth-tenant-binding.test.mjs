import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const authSource = readFileSync(new URL('../lib/studio-auth.ts', import.meta.url), 'utf8');

for (const token of [
  "verifyIdToken(token, true)",
  "collection('studios').doc(studioId).collection('members').doc(uid).get()",
  "membership?.uid !== uid",
  "membership?.studioId !== studioId",
  "membership?.schemaVersion !== 2",
  "membership?.status !== 'active'",
  "authMode: 'firebase_membership'",
  "studio_edit_role_required",
  "STUDIO_EDIT_ROLES.has(role)",
]) assert.ok(authSource.includes(token), `Studio auth missing canonical membership token: ${token}`);

assert.doesNotMatch(authSource, /decoded\.tenantId/);
assert.doesNotMatch(authSource, /tenantId:\s*requestedStudio[,\n]/, 'caller-selected Studio must not be returned without membership verification');
assert.match(authSource, /missing_studio_scope/);
assert.match(authSource, /studio_membership_required/);
