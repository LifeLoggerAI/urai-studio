import assert from 'node:assert/strict';
import fs from 'node:fs';

const shell = fs.readFileSync(new URL('../components/studio/StudioShell.tsx', import.meta.url), 'utf8');

assert.match(shell, /href="https:\/\/urai\.app\/adam"/, 'Studio shell must expose the canonical Adam presence entry');
assert.match(shell, /Adam · Founder presence/, 'Studio adapter must label the founder presence explicitly');
assert.doesNotMatch(shell, /iframe[^>]+urai\.app\/adam/i, 'Studio must link to the canonical runtime rather than cloning or embedding a second Adam runtime');

console.log('Studio Adam presence adapter contract passed');
