import { validateSourceEvidencePacket } from './source-evidence';
import type { SourceEvidencePacket } from './source-evidence';

/** Offline, public-safe metadata-only private ingestion preflight.
 * NEVER grants authorization, uploads media, links identities or writes memories.
 * Receipt fields are pointers that still need independent provider verification.
 */
export type PrivateSourcePreflightRow = {
  opaqueId: string;
  originalSha256: string | null;
  originalBytes: number;
  technicalState: 'VERIFIED' | 'FOUND BUT UNPROCESSED' | 'CORRUPT';
  freshByteReceipt?: { sha256: string; bytes: number } | null;
  decodeState: 'PASS' | 'FAIL' | 'UNVERIFIED' | 'NONMEDIA';
  transcriptState?: 'NONE' | 'MACHINE_DRAFT' | 'HUMAN_REVIEWED';
  sourcePacket?: SourceEvidencePacket;
  humanReviewReceipt?: string | null;
  consentReceipt?: string | null;
  ownerLinkReceipt?: string | null;
  productionIngestReceipt?: string | null;
  indexReceipt?: string | null;
  memoryStarReceipt?: string | null;
  replayReceipt?: string | null;
};

export type PrivateSourcePreflightSummary = {
  schemaVersion: 'urai-private-source-preflight-v1';
  total: number;
  archivalVerified: number;
  foundButUnprocessed: number;
  corrupt: number;
  freshHashAndLengthMatched: number;
  technicallyEligibleForHumanReview: number;
  quarantined: number;
  duplicateGroups: number;
  excessIdenticalCopies: number;
  machineDraftTranscriptRows: number;
  withHumanReviewPointer: number;
  missingConsentPointer: number;
  missingOwnerLinkPointer: number;
  suppliedProductionReceiptPointers: number;
  productionAdmissionsCertified: 0;
  replayAdmissionsCertified: 0;
  authorizationState: 'HARD_OFF_UNTIL_INDEPENDENT_PROVIDER_PROOF';
};

const PREFLIGHT_KEY = /^[a-zA-Z0-9._:-]{1,128}$/;
const SHA256 = /^[a-f0-9]{64}$/i;

/** Return aggregate counts only, never filenames, keys, hashes or source URLs.
 * This is a readiness checklist, never production/consent authority.
 * Stable under row reordering: duplicates are preserved, not deleted.
 */
export function summarizePrivateSourcePreflight(
  rows: readonly PrivateSourcePreflightRow[],
): PrivateSourcePreflightSummary {
  if (!Array.isArray(rows) || rows.length > 100_000) throw new Error('private_preflight_invalid_batch');
  const keys = new Set<string>();
  const digests = new Map<string, number>();
  const counts = {
    archivalVerified: 0, foundButUnprocessed: 0, corrupt: 0,
    freshHashAndLengthMatched: 0, technicallyEligibleForHumanReview: 0,
    quarantined: 0, machineDraftTranscriptRows: 0,
    withHumanReviewPointer: 0, missingConsentPointer: 0,
    missingOwnerLinkPointer: 0, suppliedProductionReceiptPointers: 0,
  };
  for (const row of rows) {
    if (!row || !PREFLIGHT_KEY.test(row.opaqueId) || keys.has(row.opaqueId))
      throw new Error('private_preflight_duplicate_or_invalid_opaque_id');
    keys.add(row.opaqueId);
    if (!Number.isSafeInteger(row.originalBytes) || row.originalBytes < 0 ||
        (row.originalSha256 !== null && !SHA256.test(row.originalSha256)))
      throw new Error('private_preflight_invalid_original_evidence');
    if (!['VERIFIED', 'FOUND BUT UNPROCESSED', 'CORRUPT'].includes(row.technicalState) ||
        !['PASS', 'FAIL', 'UNVERIFIED', 'NONMEDIA'].includes(row.decodeState))
      throw new Error('private_preflight_invalid_technical_state');
    if (row.sourcePacket && !validateSourceEvidencePacket(row.sourcePacket).ok)
      throw new Error('private_preflight_invalid_source_packet');
    if (row.originalSha256) {
      const key = row.originalSha256.toLowerCase();
      const previous = digests.get(key);
      if (previous !== undefined && previous !== row.originalBytes)
        throw new Error('private_preflight_digest_length_conflict');
      digests.set(key, row.originalBytes);
    }
    if (row.technicalState === 'VERIFIED') counts.archivalVerified += 1;
    if (row.technicalState === 'FOUND BUT UNPROCESSED') counts.foundButUnprocessed += 1;
    if (row.technicalState === 'CORRUPT') counts.corrupt += 1;
    const fresh = !!row.originalSha256 && !!row.freshByteReceipt &&
      row.freshByteReceipt.sha256.toLowerCase() === row.originalSha256.toLowerCase() &&
      row.freshByteReceipt.bytes === row.originalBytes && row.originalBytes > 0;
    if (fresh) counts.freshHashAndLengthMatched += 1;
    const originalNotDerived = !row.sourcePacket ||
      !['generated', 'edited-derivative', 'transcode'].includes(row.sourcePacket.sourceClass);
    const valid = row.technicalState === 'VERIFIED' && fresh &&
      row.decodeState === 'PASS' && originalNotDerived;
    if (valid) counts.technicallyEligibleForHumanReview += 1;
    if (row.technicalState === 'CORRUPT' || row.decodeState === 'FAIL' ||
        (row.freshByteReceipt && !fresh)) counts.quarantined += 1;
    if (row.transcriptState === 'MACHINE_DRAFT') counts.machineDraftTranscriptRows += 1;
    if (row.humanReviewReceipt) counts.withHumanReviewPointer += 1;
    if (!row.consentReceipt) counts.missingConsentPointer += 1;
    if (!row.ownerLinkReceipt) counts.missingOwnerLinkPointer += 1;
    if (row.productionIngestReceipt) counts.suppliedProductionReceiptPointers += 1;
  }
  const frequency = new Map<string, number>();
  for (const row of rows) if (row.originalSha256) {
    const key = row.originalSha256.toLowerCase();
    frequency.set(key, (frequency.get(key) ?? 0) + 1);
  }
  let duplicateGroups = 0, excessIdenticalCopies = 0;
  for (const size of frequency.values()) if (size > 1) {
    duplicateGroups += 1; excessIdenticalCopies += size - 1;
  }
  return Object.freeze({ schemaVersion: 'urai-private-source-preflight-v1',
    total: rows.length, ...counts, duplicateGroups, excessIdenticalCopies,
    productionAdmissionsCertified: 0, replayAdmissionsCertified: 0,
    authorizationState: 'HARD_OFF_UNTIL_INDEPENDENT_PROVIDER_PROOF' });
}
