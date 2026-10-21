import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

const src = fs.readFileSync(new URL('../../../functions/src/job-runner.ts', import.meta.url), 'utf8');
const indexes = JSON.parse(fs.readFileSync(new URL('../../../firestore.indexes.json', import.meta.url), 'utf8'));

function assertIndex(expected) {
  assert.ok(indexes.indexes.some(index =>
    index.collectionGroup === 'jobs' && index.queryScope === 'COLLECTION' &&
    JSON.stringify(index.fields) === JSON.stringify(expected)),
  'missing jobs composite index: ' + JSON.stringify(expected));
}

test('queued priority scheduler has a committed composite index', () => {
  assertIndex([
    { fieldPath: 'state', order: 'ASCENDING' },
    { fieldPath: 'priority', order: 'DESCENDING' },
    { fieldPath: 'createdAt', order: 'ASCENDING' },
  ]);
});

test('expired lease scheduler orders by its inequality field and has a matching index', () => {
  assert.match(src, /const expiredJobsQuery\s*=\s*db\.collection\("jobs"\)\.where\("state", "==", "running"\)\s*\.where\("leaseExpiresAt", "<", now\)\.orderBy\("leaseExpiresAt"(?:, "asc")?\)\.orderBy\("priority", "desc"\)\.orderBy\("createdAt"\)\.limit\(25\)/);
  assertIndex([
    { fieldPath: 'state', order: 'ASCENDING' },
    { fieldPath: 'leaseExpiresAt', order: 'ASCENDING' },
    { fieldPath: 'priority', order: 'DESCENDING' },
    { fieldPath: 'createdAt', order: 'ASCENDING' },
  ]);
});
