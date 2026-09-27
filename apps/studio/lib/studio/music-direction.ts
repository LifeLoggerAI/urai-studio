export type MusicDirectionMood =
  | 'calm'
  | 'reflective'
  | 'energized'
  | 'heavy'
  | 'uncertain'
  | 'hopeful';

export type MusicDirectionCue = {
  id: string;
  productionId: string;
  startMs: number;
  endMs: number;
  mood: MusicDirectionMood;
  intensity: number;
  dialoguePriority: boolean;
  motifRefs: string[];
  sourceRefs: string[];
  rightsRef?: string;
  provenance: 'original-local' | 'licensed' | 'generated' | 'user-supplied' | 'unknown';
  generationRequested: boolean;
  generationAuthorized: false;
  stemsRequired: boolean;
  cueSheetRequired: boolean;
  loopAndTailPlanRequired: boolean;
  dialogueDuckingDb?: { min: number; max: number };
  deliveryMixes: Array<'stereo' | 'headphone' | 'sensory-safe' | 'audio-description'>;
};

export const MUSIC_DIRECTION_AUTHORITY = {
  owner: 'URAI Studio',
  purpose: 'score intent, motif continuity, emotional pacing and dialogue-safe mix planning',
  generationIsNotRequiredForPlanning: true,
  providerNeutral: true,
  generatedMusicMustRemainProvenanced: true,
  licensedOrUserMusicRequiresRightsAuthority: true,
  providerExecutionAuthorized: false,
  publicReleaseAuthorized: false,
  finalMixRequirements: [
    'retained stems',
    'cue sheet',
    'loop/tail plan',
    'dialogue/narration intelligibility review',
    'rights provenance',
    'sensory-safe alternative where required',
  ],
} as const;

export function validateMusicDirectionCue(cue: MusicDirectionCue): string[] {
  const errors: string[] = [];
  if (!cue.id.trim()) errors.push('music_direction_id_required');
  if (!cue.productionId.trim()) errors.push('music_direction_production_required');
  if (!Number.isFinite(cue.startMs) || !Number.isFinite(cue.endMs) || cue.startMs < 0 || cue.endMs <= cue.startMs) {
    errors.push('music_direction_range_invalid');
  }
  if (!Number.isFinite(cue.intensity) || cue.intensity < 0 || cue.intensity > 1) errors.push('music_direction_intensity_invalid');
  if ((cue.provenance === 'licensed' || cue.provenance === 'user-supplied') && !cue.rightsRef?.trim()) {
    errors.push('music_direction_rights_required');
  }
  if (cue.provenance === 'unknown') errors.push('music_direction_provenance_unresolved');
  if (cue.generationAuthorized !== false) errors.push('music_direction_generation_must_start_off');
  if (!cue.stemsRequired) errors.push('music_direction_stems_required');
  if (!cue.cueSheetRequired) errors.push('music_direction_cue_sheet_required');
  if (!cue.loopAndTailPlanRequired) errors.push('music_direction_loop_tail_plan_required');
  if (cue.dialoguePriority) {
    const ducking = cue.dialogueDuckingDb;
    if (!ducking || ducking.min < 0 || ducking.max < ducking.min || ducking.max > 24) {
      errors.push('music_direction_dialogue_ducking_plan_required');
    }
  }
  if (cue.deliveryMixes.length === 0) errors.push('music_direction_delivery_mix_required');
  return errors;
}
