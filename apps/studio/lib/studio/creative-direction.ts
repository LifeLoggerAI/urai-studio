export type CreativeDirectionRole =
  | 'director'
  | 'continuity'
  | 'cinematography'
  | 'motion-performance'
  | 'music'
  | 'sound-dialogue'
  | 'accessibility'
  | 'truth-provenance'
  | 'rights-privacy'
  | 'finishing';

export type CreativeDirectionDecision = {
  role: CreativeDirectionRole;
  productionId: string;
  decisionId: string;
  instruction: string;
  inputRefs: string[];
  outputRefs: string[];
  evidenceRefs: string[];
  requiresHumanApproval: boolean;
};

export const CREATIVE_DIRECTION_RESPONSIBILITIES: Record<CreativeDirectionRole, readonly string[]> = {
  director: ['story intent', 'scene purpose', 'performance intent', 'final creative coherence'],
  continuity: ['source continuity', 'character continuity', 'place continuity', 'timeline continuity'],
  cinematography: ['shot grammar', 'camera intent', 'framing', 'lighting intent'],
  'motion-performance': ['body motion intent', 'facial performance intent', 'gesture intent', 'reduced-motion alternative'],
  music: ['score intent', 'motif continuity', 'dialogue priority', 'rights-cleared music boundary'],
  'sound-dialogue': ['dialogue intelligibility', 'narration', 'diegetic sound', 'mix intent'],
  accessibility: ['captions', 'audio description', 'sensory-safe alternative', 'reduced-motion/reduced-stimulation'],
  'truth-provenance': ['truth classification', 'source lineage', 'reconstruction/generated disclosure'],
  'rights-privacy': ['consent', 'likeness/voice authority', 'music/footage rights', 'private-source boundary'],
  finishing: ['editorial conform', 'color/visual consistency', 'mastering', 'delivery package'],
};

export const CREATIVE_DIRECTION_AUTHORITY = {
  owner: 'URAI Studio',
  studioRole: 'director, continuity supervisor, editorial compiler, finishing authority',
  executionBoundary: 'Asset Factory and authorized providers execute governed generation; they do not inherit final creative or release authority',
  roleModel: 'functional-production-authorities-not-autonomous-personas',
  providerSpendAuthorized: false,
  publicReleaseAuthorized: false,
  humanApprovalRequiredFor: [
    'final film pacing',
    'autobiographical or disputed factual truth',
    'likeness and voice synthesis',
    'music licensing',
    'product visual quality',
    'public claims',
    'final public release',
  ],
} as const;

export function validateCreativeDirectionDecision(decision: CreativeDirectionDecision): string[] {
  const errors: string[] = [];
  if (!decision.productionId.trim()) errors.push('creative_direction_production_required');
  if (!decision.decisionId.trim()) errors.push('creative_direction_decision_id_required');
  if (!decision.instruction.trim()) errors.push('creative_direction_instruction_required');
  if (decision.evidenceRefs.length === 0) errors.push('creative_direction_evidence_required');
  if (decision.role === 'rights-privacy' && !decision.requiresHumanApproval) {
    errors.push('creative_direction_rights_privacy_requires_human_approval');
  }
  return errors;
}
