import assert from 'node:assert/strict';
import fs from 'node:fs';

const lifeMovies = fs.readFileSync(new URL('../lib/studio/life-movies.ts', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../lib/studio/storytime-life-movie.ts', import.meta.url), 'utf8');

for (const token of [
  "'weekly-recap'",
  "'seasonal-story'",
  "'relationship-arc'",
  "'emotional-arc'",
  "'recovery-arc'",
  "'memory-replay'",
  "'mirror-of-becoming'",
  "'soul-thread'",
  'life_movie_narrative_authority_required',
]) assert.ok(lifeMovies.includes(token), `Life Movie narrative contract missing: ${token}`);

for (const token of [
  "daily_summary: 'daily-reflection'",
  "weekly_scroll: 'weekly-recap'",
  "relationship_reflection: 'relationship-arc'",
  "emotional_arc: 'emotional-arc'",
  "recovery_chapter: 'recovery-arc'",
  "memory_replay: 'memory-replay'",
  "storyOwner: 'URAI Storytime'",
  "cinemaOwner: 'URAI Studio'",
  'storytime_relationship_thread_required',
  'storytime_emotional_arc_required',
  'providerExecutionAuthorized: false',
  'publicReleaseAuthorized: false',
]) assert.ok(bridge.includes(token), `Storytime/Life Movie bridge missing: ${token}`);

console.log('Storytime to Life Movie editorial bridge contract passed');
