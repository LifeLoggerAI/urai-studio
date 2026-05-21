import assert from 'node:assert/strict';
import fs from 'node:fs';

const component = fs.readFileSync(new URL('../components/site/MagicalHomeExperience.tsx', import.meta.url), 'utf8');
const homePage = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');

const requiredMarkers = [
  'data-urai-v1-home-experience',
  'data-urai-v1-home-shell="ground-orb-chat"',
  'data-urai-home-layer="ground-world"',
  'data-urai-home-layer="orb-chat"',
  'data-urai-home-layer="chat-interface"',
  'data-urai-home-layer="sky-memory-stars"',
  'data-urai-v1-field-reconstruction',
  'relationship fields',
  'recovery fields',
  'emotional field reconstruction',
  'asset factory handoff',
  'Studio / Cinema / Motion / Visuals / Music lattice',
];

for (const marker of requiredMarkers) {
  assert.ok(component.includes(marker), `missing V1 home marker: ${marker}`);
}

assert.ok(homePage.includes("import { MagicalHomeExperience }"), 'home page must import V1 magical home panel');
assert.ok(homePage.includes('<MagicalHomeExperience />'), 'home page must render V1 magical home panel');

console.log('V1 magical home coverage passed');
