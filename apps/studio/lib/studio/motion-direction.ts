export type MotionDirectionClass =
  | 'camera'
  | 'environment'
  | 'object'
  | 'orb'
  | 'character-body'
  | 'character-face'
  | 'lip-sync'
  | 'hair-cloth'
  | 'transition'
  | 'haptic';

export type MotionDirectionCue = {
  id: string;
  productionId: string;
  class: MotionDirectionClass;
  startMs: number;
  endMs: number;
  authorityRef: string;
  sourceRefs: string[];
  reducedMotionEquivalentRef: string;
  provenance: 'runtime-authored' | 'recorded-performance' | 'generated' | 'reconstructed' | 'manual-animation' | 'unknown';
  humanPerformanceRequired: boolean;
  finalHumanPerformanceCertified: false;
};

export const MOTION_DIRECTION_AUTHORITY = {
  owner: 'URAI Studio',
  runtimeOwners: ['URAI Spatial motion orchestration', 'governed asset animation', 'haptic runtime'],
  currentlyEvidenceBacked: [
    'camera motion',
    'environmental motion',
    'object motion',
    'Orb state motion',
    'route/world transitions',
    'haptic cues',
    'reduced-motion alternatives',
  ],
  notYetGenerallyCertified: [
    'photoreal facial performance',
    'production lip sync',
    'hair simulation',
    'cloth simulation',
    'final likeness-bearing human performance',
  ],
  providerExecutionAuthorized: false,
  publicReleaseAuthorized: false,
} as const;

export function validateMotionDirectionCue(cue: MotionDirectionCue): string[] {
  const errors: string[] = [];
  if (!cue.id.trim()) errors.push('motion_direction_id_required');
  if (!cue.productionId.trim()) errors.push('motion_direction_production_required');
  if (!Number.isFinite(cue.startMs) || !Number.isFinite(cue.endMs) || cue.startMs < 0 || cue.endMs <= cue.startMs) {
    errors.push('motion_direction_range_invalid');
  }
  if (!cue.authorityRef.trim()) errors.push('motion_direction_authority_required');
  if (!cue.reducedMotionEquivalentRef.trim()) errors.push('motion_direction_reduced_motion_equivalent_required');
  if (cue.provenance === 'unknown') errors.push('motion_direction_provenance_unresolved');
  if (cue.humanPerformanceRequired && cue.finalHumanPerformanceCertified !== false) {
    errors.push('motion_direction_human_performance_must_start_uncertified');
  }
  return errors;
}
