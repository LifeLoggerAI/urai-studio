import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync(new URL('../app/api/studio/feature-policy/route.ts', import.meta.url), 'utf8');

for (const token of [
  'requireStudioAuth',
  "auth.role !== 'owner'",
  "auth.role !== 'admin'",
  'studioFeaturePolicies',
  'mutationEndpointAvailable: false',
  'sourceRegistryCanAuthorizeActivation: false',
  'feature_activation_mutation_not_available',
  'activationAuthorized: false',
  "Allow: 'GET'",
]) {
  assert.ok(route.includes(token), `feature-policy route missing: ${token}`);
}

assert.ok(!route.includes('process.env.'), 'feature-policy diagnostic route must not expose raw environment values');
assert.ok(!route.includes('NEXT_PUBLIC_'), 'feature-policy diagnostic route must not trust public environment configuration');

console.log('Studio feature-policy diagnostic route guard passed');
