import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

// Source contract for the authenticated, NON-DISPATCH Life Movie envelope route.
// Full behavioral coverage is in the separate bounded-request route probe.
const file = process.env.URAI_R451_ROUTE_SOURCE ||
  new URL('../app/api/studio/video-factory/jobs-contract/route.ts', import.meta.url);
const source = readFileSync(file, 'utf8');

test('auth happens before private request parsing and envelope construction', () => {
  const auth = source.indexOf('await requireStudioAuth(request)');
  const parse = source.indexOf('await readStudioLongformJson(request, 512 * 1024)');
  const envelope = source.indexOf('buildJobsLifeMovieEnvelope({');
  assert.ok(auth >= 0 && parse > auth && envelope > parse);
});
test('contract parser has a 512 KiB stream bound and never uses unbounded request.json', () => {
  assert.match(source, /await readStudioLongformJson\(request, 512 \* 1024\)/);
  assert.doesNotMatch(source, /await\s+request\.json\s*\(/);
});
test('oversized and malformed parser errors retain their HTTP status', () => {
  assert.match(source, /error instanceof StudioLongformError \? error\.status : 400/);
  assert.match(source, /error instanceof StudioLongformError \? error\.code/);
  assert.match(source, /\^\[a-z0-9_\]\{1,120\}\$/);
});
test('envelope-only endpoint rejects unknown fields and cannot dispatch', () => {
  assert.match(source, /Object\.keys\(body\)\.some\(/);
  assert.match(source, /life_movie_unknown_request_field/);
  assert.match(source, /dispatchAuthorized:false/);
  assert.match(source, /providerGenerationAuthorized:false/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
});
