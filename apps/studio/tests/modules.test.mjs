import assert from 'node:assert/strict';
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../lib/studio/modules.ts', import.meta.url), 'utf8');
const required=['studio','asset-factory','spatial','motion','cinema','music','visuals','content','marketing','analytics','admin','foundation','jobs','privacy','investors'];
for (const id of required) assert.ok(src.includes(`'${id}'`) || src.includes(`"${id}"`), `missing ${id}`);
assert.ok(src.includes('moduleByRoute'));
console.log('module registry coverage passed');
