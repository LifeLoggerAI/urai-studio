export const CREATIVE_TIMELINE_SCHEMA = 'urai-creative-timeline-1' as const;

export type CreativeTimelineLane =
  | 'picture'
  | 'camera'
  | 'motion'
  | 'dialogue'
  | 'narration'
  | 'music'
  | 'sound'
  | 'caption'
  | 'haptic'
  | 'interaction'
  | 'truth-label'
  | 'accessibility';

export type CreativeProvenanceClass =
  | 'recorded-source'
  | 'verified-metadata'
  | 'user-recorded-memory'
  | 'reconstructed'
  | 'inferred'
  | 'generated'
  | 'artistic-interpretation'
  | 'unknown';

export type CreativeTimelineEvent = {
  id: string;
  lane: CreativeTimelineLane;
  startMs: number;
  endMs: number;
  sourceRefs: string[];
  provenance: CreativeProvenanceClass;
  authorityRef: string;
  payloadRef?: string;
  beatRef?: string;
};

export type CreativeTimelineBeat = {
  id: string;
  atMs: number;
  purpose:
    | 'cut'
    | 'dialogue-boundary'
    | 'music-beat'
    | 'camera-cue'
    | 'motion-cue'
    | 'caption-cue'
    | 'haptic-cue'
    | 'interaction-cue'
    | 'truth-cue';
};

export type CreativeTimeline = {
  schemaVersion: typeof CREATIVE_TIMELINE_SCHEMA;
  productionId: string;
  durationMs: number;
  events: CreativeTimelineEvent[];
  beats: CreativeTimelineBeat[];
  providerExecutionAuthorized: false;
  publicReleaseAuthorized: false;
};

const MAX_LAUNCH_DURATION_MS = 45 * 60 * 1000;

export function validateCreativeTimeline(timeline: CreativeTimeline): string[] {
  const errors: string[] = [];
  if (timeline.schemaVersion !== CREATIVE_TIMELINE_SCHEMA) errors.push('creative_timeline_schema_unsupported');
  if (!timeline.productionId.trim()) errors.push('creative_timeline_production_id_required');
  if (!Number.isFinite(timeline.durationMs) || timeline.durationMs <= 0) errors.push('creative_timeline_duration_invalid');
  if (timeline.durationMs > MAX_LAUNCH_DURATION_MS) errors.push('creative_timeline_launch_duration_exceeded');
  if (timeline.providerExecutionAuthorized !== false) errors.push('creative_timeline_provider_execution_must_start_off');
  if (timeline.publicReleaseAuthorized !== false) errors.push('creative_timeline_public_release_must_start_off');

  const ids = new Set<string>();
  for (const event of timeline.events) {
    if (!event.id.trim()) errors.push('creative_timeline_event_id_required');
    if (ids.has(event.id)) errors.push(`creative_timeline_duplicate_event:${event.id}`);
    ids.add(event.id);
    if (!Number.isFinite(event.startMs) || !Number.isFinite(event.endMs) || event.startMs < 0 || event.endMs <= event.startMs) {
      errors.push(`creative_timeline_event_range_invalid:${event.id}`);
    }
    if (event.endMs > timeline.durationMs) errors.push(`creative_timeline_event_exceeds_duration:${event.id}`);
    if (!event.authorityRef.trim()) errors.push(`creative_timeline_authority_required:${event.id}`);
    if (
      ['picture','dialogue','narration','music','sound','truth-label'].includes(event.lane)
      && event.provenance !== 'generated'
      && event.provenance !== 'artistic-interpretation'
      && event.sourceRefs.length === 0
    ) {
      errors.push(`creative_timeline_source_required:${event.id}`);
    }
  }

  const beatIds = new Set<string>();
  for (const beat of timeline.beats) {
    if (!beat.id.trim()) errors.push('creative_timeline_beat_id_required');
    if (beatIds.has(beat.id)) errors.push(`creative_timeline_duplicate_beat:${beat.id}`);
    beatIds.add(beat.id);
    if (!Number.isFinite(beat.atMs) || beat.atMs < 0 || beat.atMs > timeline.durationMs) {
      errors.push(`creative_timeline_beat_range_invalid:${beat.id}`);
    }
  }

  return errors;
}

export function createCreativeTimeline(input: Omit<CreativeTimeline, 'schemaVersion' | 'providerExecutionAuthorized' | 'publicReleaseAuthorized'>): CreativeTimeline {
  const timeline: CreativeTimeline = {
    schemaVersion: CREATIVE_TIMELINE_SCHEMA,
    ...input,
    providerExecutionAuthorized: false,
    publicReleaseAuthorized: false,
  };
  const errors = validateCreativeTimeline(timeline);
  if (errors.length) throw new Error(errors.join(','));
  return timeline;
}

export const CREATIVE_TIMELINE_AUTHORITY = {
  owner: 'URAI Studio',
  scope: 'shared temporal authority for cinema, motion, music, voice, sound, accessibility, truth cues and interaction',
  notProviderAuthorization: true,
  notPublicReleaseAuthorization: true,
  launchDurationMs: MAX_LAUNCH_DURATION_MS,
} as const;
