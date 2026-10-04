import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract = JSON.parse(
  await readFile(
    new URL('../../../productions/media-master/source-evidence.contract.json', import.meta.url),
    'utf8',
  ),
);

test('source evidence keeps originals immutable and derivatives separate', () => {
  assert.equal(contract.rules.sourceBytesImmutable, true);
  assert.equal(contract.rules.derivativesStoredSeparately, true);
  assert.equal(contract.rules.sha256RequiredForOriginal, true);
  assert.equal(contract.rules.equalByteSizeIsNotDeduplication, true);
  assert.equal(contract.rules.generatedMediaIsNeverSourceTruth, true);
});

test('metadata supports canon without silently becoming truth', () => {
  assert.equal(contract.rules.metadataTimestampIsNotCaptureTimeUnlessProven, true);
  assert.equal(contract.rules.fileNameLabelIsNotIdentityProof, true);
  assert.equal(contract.rules.folderLabelIsNotIdentityProof, true);
  assert.equal(contract.rules.facialResemblanceIsNotIdentityProof, true);
  assert.equal(contract.rules.sourceSpecificityCapsCanonSpecificity, true);
});

test('GPS and private identity stay private by default', () => {
  assert.equal(contract.privacy.preciseGpsMayEnterPublicRepo, false);
  assert.equal(contract.privacy.privateNamesMayEnterPublicRepo, false);
  assert.equal(contract.privacy.exactPrivateAddressesMayEnterPublicRepo, false);
  assert.equal(contract.rules.preciseGpsPrivateByDefault, true);
  assert.equal(contract.rules.gpsPresenceMayBeRecordedWithoutCoordinates, true);
});

test('same-event clustering is evidence driven and fail closed', () => {
  for (const signal of [
    'capture-time proximity',
    'shared device',
    'shared GPS region',
    'same visible people',
    'same wardrobe',
    'same vehicle or object',
    'same architecture',
    'same environment',
    'same batch or album',
    'sequential filenames',
    'continuous video/photo burst',
    'matching testimony',
  ]) assert.ok(contract.sameEventClusterSignals.includes(signal), `missing cluster signal: ${signal}`);

  for (const stop of [
    'conflicting identity',
    'conflicting place',
    'conflicting era',
    'generated derivative mistaken for original',
  ]) assert.ok(contract.sameEventClusterHardStops.includes(stop), `missing cluster hard stop: ${stop}`);
});
