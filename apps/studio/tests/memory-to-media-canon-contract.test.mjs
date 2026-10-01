import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract = JSON.parse(
  await readFile(
    new URL('../../../productions/media-master/memory-to-media-canon.contract.json', import.meta.url),
    'utf8',
  ),
);

test('memory-to-media contract is fail-closed before generation', () => {
  assert.equal(contract.state, 'fail-closed');
  assert.equal(contract.providerRole, 'renderer-only');
  assert.equal(contract.sceneTruthPacket.sceneTruthPacketRequired, undefined);
  assert.equal(contract.preGeneration.sceneTruthPacketRequired, true);
  assert.equal(contract.preGeneration.privateCanonResolutionRequired, true);
  assert.equal(contract.preGeneration.rawNarrativeOnlyPromptingAllowed, false);
  assert.equal(contract.preGeneration.criticalContradictionMayProceed, false);
  assert.equal(contract.sceneTruthPacket.unresolvedCriticalFieldsBlockGeneration, true);
  assert.equal(contract.sceneTruthPacket.unresolvedContradictionsBlockGeneration, true);
  assert.equal(contract.sceneTruthPacket.unknownMustRemainUnknown, true);
});

test('memory-to-media contract encodes the known regression classes', () => {
  for (const code of [
    'IDENTITY_FAIL',
    'ROLE_FAIL',
    'ERA_FAIL',
    'EYEWEAR_FAIL',
    'VEHICLE_FAIL',
    'ENVIRONMENT_FAIL',
    'GEOGRAPHY_FAIL',
    'CONTINUITY_FAIL',
    'ANACHRONISM_FAIL',
    'GENERICIZATION_FAIL',
  ]) {
    assert.ok(contract.failureCodes.includes(code), `missing failure code: ${code}`);
  }

  for (const regression of [
    'role-must-not-be-inferred-from-transport',
    'era-specific-eyewear-must-not-drift',
    'rural-environment-must-not-drift-urban',
    'generic-parent-likeness-must-fail',
    'unsupported-period-vehicle-must-fail',
  ]) {
    assert.ok(contract.regressionCases.includes(regression), `missing regression case: ${regression}`);
  }
});

test('provider success and photorealism can never equal acceptance', () => {
  assert.equal(contract.postGeneration.validationRequired, true);
  assert.equal(contract.postGeneration.compareAgainstSceneTruthPacket, true);
  assert.equal(contract.postGeneration.materialFailureBlocksAcceptance, true);
  assert.equal(contract.postGeneration.providerSuccessIsAcceptance, false);
  assert.equal(contract.postGeneration.photorealismAloneIsAcceptance, false);
  assert.equal(contract.postGeneration.unknownMayBePromotedToRecordedTruth, false);
});

test('identifiable people and continuity require visible evidence and receipts', () => {
  assert.equal(contract.shotAcceptanceReceipt.acceptedRequiresZeroMaterialFailureCodes, true);
  assert.equal(contract.shotAcceptanceReceipt.acceptedRequiresHumanVisibleEvidenceForIdentifiablePeople, true);
  assert.equal(contract.shotAcceptanceReceipt.acceptedRequiresContinuityReceiptWhenDependent, true);
  assert.equal(contract.sceneTruthPacket.eraSpecificIdentityRequiredForIdentifiablePeople, true);
  assert.equal(contract.sceneTruthPacket.roleBindingRequiredWhenOccupationOrServiceIsDepicted, true);
  assert.equal(contract.sceneTruthPacket.vehicleSpecificityCannotExceedEvidence, true);
});

test('public repository contract contains only abstract production policy', () => {
  const serialized = JSON.stringify(contract);
  assert.equal(contract.publicRepoPolicy.privateDriveIdentifiersAllowed, false);
  assert.equal(contract.publicRepoPolicy.privateNamesAllowed, false);
  assert.equal(contract.publicRepoPolicy.exactPrivateAddressesAllowed, false);
  assert.equal(contract.publicRepoPolicy.rawPrivateMediaAllowed, false);
  assert.doesNotMatch(serialized, /drive\.google\.com|docs\.google\.com|gmail\.com/i);
});
