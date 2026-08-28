export type LifeFilmCanonPurpose =
  | 'likeness-reference'
  | 'character-continuity'
  | 'age-continuity'
  | 'motion-reference'
  | 'gait-reference'
  | 'cinematic-reconstruction'
  | 'life-film';

export type LifeFilmCanonResolutionRequest = {
  sourceKey: string;
  purpose: LifeFilmCanonPurpose;
  projectId: string;
};

export type LifeFilmCanonResolutionResult = {
  ok: true;
  sourceKey: string;
  canonicalKey: string;
  evidenceClass: 'visual-canon';
  mediaKind: 'image' | 'video';
  mimeType: string;
  byteSize: number;
  storageObject: string;
  generationEligible: boolean;
  truthBoundary: string;
  verifiedGeneration: string | null;
  privacy: {
    rawDrivePointerExposed: false;
    clientDownloadUrlIssued: false;
    privateStorageOnly: true;
  };
};

const PRIVATE_CANON_KEYS = new Set([
  'ADAM-CURRENT-LIKENESS-001',
  'ADAM-AGE19-001',
  'ADAM-JACOB-MOTION-001',
  'JACOB-GARAGE-001',
  'TERRY-MAILDROP-VIDSET-001',
  'TYSON-CANON-001',
]);

export function isPrivateLifeFilmCanonKey(sourceKey: string) {
  return PRIVATE_CANON_KEYS.has(sourceKey);
}

export function buildLifeFilmCanonResolutionRequest(
  sourceKey: string,
  purpose: LifeFilmCanonPurpose,
  projectId: string,
): LifeFilmCanonResolutionRequest {
  if (!isPrivateLifeFilmCanonKey(sourceKey)) {
    throw new Error(`unknown_or_unapproved_life_film_canon_key:${sourceKey}`);
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(projectId)) {
    throw new Error('invalid_life_film_project_id');
  }
  return { sourceKey, purpose, projectId };
}

/**
 * Public-safe contract only.
 *
 * Runtime callers must invoke the private authenticated
 * resolveAuthorizedLifeFilmCanon broker. This module intentionally contains
 * no Drive IDs, private filenames, private cloud links, or identity secrets.
 */
export const LIFE_FILM_CANON_BROKER_FUNCTION = 'resolveAuthorizedLifeFilmCanon' as const;
