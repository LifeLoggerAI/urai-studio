import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as nodeModule from 'node:module';

// This builds NO grant and does NOT start a worker. Only the actual source
// fingerprint function is executed against immutable synthetic Storage sources.
const bridgePath = process.env.URAI_R452_BRIDGE_SOURCE ||
  new URL('../lib/studio-life-movie-jobs-bridge.ts', import.meta.url);
const routePath = process.env.URAI_R452_ROUTE_SOURCE ||
  new URL('../app/api/studio/video-factory/jobs-contract/route.ts', import.meta.url);
const bridge = readFileSync(bridgePath, 'utf8');
const route = readFileSync(routePath, 'utf8');
const begin = bridge.indexOf('export function deriveStudioLifeMovieRenderScope(');
assert.ok(begin >= 0, 'source selection identity helper missing');
const close = bridge.indexOf('\n}\n', begin);
assert.ok(close > begin, 'could not isolate exact original helper');
const actualHelper = bridge.slice(begin, close + 3);
const transpile = typeof nodeModule.stripTypeScriptTypes === 'function'
  ? nodeModule.stripTypeScriptTypes
  : (source) => {
    const ts = nodeModule.createRequire(import.meta.url)('typescript');
    return ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
    } }).outputText;
  };
const moduleCode = `import { createHash } from 'node:crypto';\nfunction fail(code){throw new Error(code)}\n${transpile(actualHelper)}`;
const { deriveStudioLifeMovieRenderScope: derive } = await import(
  `data:text/javascript;base64,${Buffer.from(moduleCode).toString('base64')}`,
);
const originals = [
  { id:'b',bucket:'private-urai',objectPath:'tenants/t1/media/b.png',generation:'1793378565000001',
    mimeType:'image/png',provenance:'original-source',sourceRefs:['capture-b'],consentRef:'cb',ownerOrRightsRef:'rb' },
  { id:'a',bucket:'private-urai',objectPath:'tenants/t1/media/a.png',generation:'1793378565000002',
    mimeType:'image/png',provenance:'original-source',sourceRefs:['capture-a'],consentRef:'ca',ownerOrRightsRef:'ra' },
];
const plan = (sources=originals) => ({ projectId:'movie-synthetic',renderPlanDigest:'f'.repeat(64),sources });
const expected = 'f24cbf5b49b5e17e43c02b8761a224184f7f5d800fccb8670ac9dcfcd16e5f73';
const mutable = () => structuredClone(originals);

test('published scope uses the versioned, known immutable source-set fingerprint',()=>{
  const result = derive(plan());
  assert.deepEqual(result,{projectId:'movie-synthetic',renderPlanDigest:'f'.repeat(64),sourceSetDigest:expected});
});
test('selection order cannot silently change the set fingerprint',()=>{
  assert.equal(derive(plan([...originals].reverse())).sourceSetDigest, expected);
});
test('replaced Storage object generation changes the fingerprint',()=>{
  const items=mutable();items[0].generation='1793378565000003';
  assert.notEqual(derive(plan(items)).sourceSetDigest, expected);
});
test('changed server rights reference changes the fingerprint',()=>{
  const items=mutable();items[1].ownerOrRightsRef='other-rights';
  assert.notEqual(derive(plan(items)).sourceSetDigest, expected);
});
test('modified source consent and source provenance change the fingerprint',()=>{
  const items=mutable();items[1].consentRef='other-consent';
  assert.notEqual(derive(plan(items)).sourceSetDigest, expected);
  const more=mutable();more[0].sourceRefs=['other-source'];
  assert.notEqual(derive(plan(more)).sourceSetDigest, expected);
});
test('duplicate source identifiers fail closed',()=>{
  const items=mutable();items[1].id=items[0].id;
  assert.throws(()=>derive(plan(items)),/life_movie_duplicate_source_id/);
});
test('contract response exposes only a preview, never a consent authority',()=>{
  assert.match(route,/deriveStudioLifeMovieRenderScope\(envelope\.payload\)/);
  assert.match(route,/renderScope,/);
  assert.match(route,/renderConsentAuthorized:false/);
  assert.match(route,/consentGrantIssued:false/);
  assert.match(route,/dispatchAuthorized:false/);
  assert.doesNotMatch(route,/\bfetch\s*\(/);
});
test('contract still authenticates and bounds request before showing the scope',()=>{
  const auth=route.indexOf('await requireStudioAuth(request)');
  const parse=route.indexOf('await readStudioLongformJson(request, 512 * 1024)');
  const preview=route.indexOf('deriveStudioLifeMovieRenderScope(envelope.payload)');
  assert.ok(auth>=0 && parse>auth && preview>parse);
});
