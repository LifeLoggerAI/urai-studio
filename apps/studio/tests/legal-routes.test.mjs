import assert from 'node:assert/strict';
import fs from 'node:fs';

const site = fs.readFileSync(new URL('../lib/studio/site.ts', import.meta.url), 'utf8');
const footer = fs.readFileSync(new URL('../components/site/Footer.tsx', import.meta.url), 'utf8');
const sitemap = fs.readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8');

for (const route of ['/privacy', '/terms']) {
  assert.ok(site.includes(`'${route}'`), `canonical public routes must include ${route}`);
  assert.ok(footer.includes(`href: '${route}'`), `footer must link ${route}`);
}

assert.ok(sitemap.includes('publicRoutes.map'), 'sitemap must derive from the canonical public route registry');
assert.ok(!site.includes("'/settings'"), 'settings must not be public-indexed');

console.log('Studio legal route and sitemap guard passed');
