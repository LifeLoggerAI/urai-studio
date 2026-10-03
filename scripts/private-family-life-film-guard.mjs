import fs from 'node:fs';
import path from 'node:path';

const fail = (message) => { throw new Error(`private_source_public_boundary:${message}`); };
const privateProductionDir = path.resolve('productions/private-memory-proof-001');
const boundaryDoc = path.resolve('productions/PRIVATE_SOURCE_BOUNDARY.md');

if (fs.existsSync(privateProductionDir)) {
  fail('private_production_directory_must_not_exist_in_public_repository');
}
if (!fs.existsSync(boundaryDoc)) {
  fail('public_private_source_boundary_document_missing');
}

const boundary = fs.readFileSync(boundaryDoc, 'utf8');
for (const marker of [
  'does not contain private source media',
  'opaque, revocable references',
  'Public release authorization remains separate',
]) {
  if (!boundary.includes(marker)) fail(`boundary_marker_missing:${marker}`);
}

console.log('Private source public boundary guard: PASS');
