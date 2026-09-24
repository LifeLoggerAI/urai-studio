import { resolveStudioFeaturePolicy } from './feature-policy';

export const LIFE_MOVIES_CONTRACT_VERSION = '1.0.0' as const;
export const LIFE_MOVIES_PROJECT_TYPE = 'life-movie' as const;
export const LIFE_MOVIES_CANONICAL_COLLECTION = 'studioProjects' as const;

export type LifeMovieExecutionMode = 'source-only' | 'provider-assisted';

export type LifeMovieStoryMode =
  | 'chronological'
  | 'thematic'
  | 'documentary'
  | 'family-history'
  | 'legacy'
  | 'user-directed'
  | 'auto-directed';

export type LifeMovieProvenanceClass =
  | 'original-source'
  | 'user-provided-fact'
  | 'verified-metadata'
  | 'user-recorded-memory'
  | 'inferred'
  | 'reconstructed'
  | 'generated'
  | 'artistic-interpretation'
  | 'unknown';

export type LifeMovieSourceKind =
  | 'photo'
  | 'video'
  | 'audio'
  | 'transcript'
  | 'storytime'
  | 'replay'
  | 'memory-star'
  | 'memory'
  | 'person'
  | 'place'
  | 'event'
  | 'user-text'
  | 'metadata';

export type LifeMovieRightsState =
  | 'unknown'
  | 'private-use-cleared'
  | 'derivative-use-cleared'
  | 'blocked';

export type LifeMovieVisualTreatment =
  | 'source-media'
  | 'cut'
  | 'pan-zoom'
  | 'crop'
  | 'parallax'
  | 'title-card'
  | 'generated-reconstruction'
  | 'generated-scene';

export type LifeMovieSourceReference = {
  id: string;
  kind: LifeMovieSourceKind;
  authorityRef: string;
  provenance: LifeMovieProvenanceClass;
  consentRefs: string[];
  rightsState: LifeMovieRightsState;
  capturedAt?: string;
  subjectRefs?: string[];
  private: true;
};

export type LifeMovieScene = {
  id: string;
  title: string;
  durationMs: number;
  sourceRefs: string[];
  truthClass: LifeMovieProvenanceClass;
  visualTreatment: LifeMovieVisualTreatment;
  narration?: string;
  dialogue?: string;
  captionText?: string;
  notes?: string;
};

export type LifeMovieOutputProfileId =
  | 'landscape-hd'
  | 'portrait-hd'
  | 'square-hd';

export type LifeMovieOutputProfile = {
  id: LifeMovieOutputProfileId;
  width: number;
  height: number;
  fps: 30;
  videoMimeType: 'video/mp4';
  companionOutputs: readonly [
    'captions-srt',
    'transcript-json',
    'render-manifest-json',
    'source-to-shot-map-json',
    'technical-qa-json',
  ];
};

export const LIFE_MOVIE_OUTPUT_PROFILES: Record<LifeMovieOutputProfileId, LifeMovieOutputProfile> = {
  'landscape-hd': {
    id: 'landscape-hd',
    width: 1920,
    height: 1080,
    fps: 30,
    videoMimeType: 'video/mp4',
    companionOutputs: [
      'captions-srt',
      'transcript-json',
      'render-manifest-json',
      'source-to-shot-map-json',
      'technical-qa-json',
    ],
  },
  'portrait-hd': {
    id: 'portrait-hd',
    width: 1080,
    height: 1920,
    fps: 30,
    videoMimeType: 'video/mp4',
    companionOutputs: [
      'captions-srt',
      'transcript-json',
      'render-manifest-json',
      'source-to-shot-map-json',
      'technical-qa-json',
    ],
  },
  'square-hd': {
    id: 'square-hd',
    width: 1080,
    height: 1080,
    fps: 30,
    videoMimeType: 'video/mp4',
    companionOutputs: [
      'captions-srt',
      'transcript-json',
      'render-manifest-json',
      'source-to-shot-map-json',
      'technical-qa-json',
    ],
  },
};

export type LifeMoviePlanInput = {
  title: string;
  storyMode: LifeMovieStoryMode;
  executionMode: LifeMovieExecutionMode;
  outputProfile: LifeMovieOutputProfileId;
  consentRefs: string[];
  sources: LifeMovieSourceReference[];
  scenes: LifeMovieScene[];
  locale: string;
};

export type LifeMovieLaunchPlan = {
  contractVersion: typeof LIFE_MOVIES_CONTRACT_VERSION;
  projectType: typeof LIFE_MOVIES_PROJECT_TYPE;
  canonicalCollection: typeof LIFE_MOVIES_CANONICAL_COLLECTION;
  title: string;
  storyMode: LifeMovieStoryMode;
  executionMode: LifeMovieExecutionMode;
  outputProfile: LifeMovieOutputProfile;
  consentRefs: string[];
  sources: LifeMovieSourceReference[];
  scenes: LifeMovieScene[];
  locale: string;
  spatialRequired: false;
  spatialDerivativeEligible: true;
  defaultPrivacy: 'private';
  renderBackend: 'deterministic-source-compose' | 'asset-factory-provider-adapter';
  providerSpendAuthorized: false;
  publicReleaseAuthorized: false;
  canCreateDraft: boolean;
  canStartRender: boolean;
  state:
    | 'invalid'
    | 'draft-ready'
    | 'ready-for-source-compose'
    | 'blocked-provider-hard-off';
  errors: string[];
  featurePolicy: {
    baseline: ReturnType<typeof resolveStudioFeaturePolicy>;
    providerEnhancement: ReturnType<typeof resolveStudioFeaturePolicy>;
  };
};

const SOURCE_ONLY_TREATMENTS = new Set<LifeMovieVisualTreatment>([
  'source-media',
  'cut',
  'pan-zoom',
  'crop',
  'parallax',
  'title-card',
]);

const PROVIDER_TREATMENTS = new Set<LifeMovieVisualTreatment>([
  'generated-reconstruction',
  'generated-scene',
]);

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function validRef(value: string) {
  return Boolean(value && value.length <= 512 && !value.includes('\n') && !value.includes('\r'));
}

export function lifeMovieRequiresProvider(input: Pick<LifeMoviePlanInput, 'executionMode' | 'scenes'>) {
  return (
    input.executionMode === 'provider-assisted' ||
    input.scenes.some((scene) => PROVIDER_TREATMENTS.has(scene.visualTreatment))
  );
}

export function validateLifeMoviePlan(input: LifeMoviePlanInput): string[] {
  const errors: string[] = [];

  if (!clean(input.title)) errors.push('title_required');
  if (!LIFE_MOVIE_OUTPUT_PROFILES[input.outputProfile]) errors.push('unsupported_output_profile');
  if (!clean(input.locale)) errors.push('locale_required');
  if (!Array.isArray(input.consentRefs) || input.consentRefs.length === 0) errors.push('project_consent_required');
  if (!Array.isArray(input.sources) || input.sources.length === 0) errors.push('source_required');
  if (!Array.isArray(input.scenes) || input.scenes.length === 0) errors.push('scene_required');

  const sourceIds = new Set<string>();
  for (const source of input.sources ?? []) {
    if (!clean(source.id) || sourceIds.has(source.id)) errors.push('source_id_invalid_or_duplicate');
    sourceIds.add(source.id);

    if (!validRef(clean(source.authorityRef))) errors.push(`source_authority_required:${source.id || 'unknown'}`);
    if (!Array.isArray(source.consentRefs) || source.consentRefs.length === 0) {
      errors.push(`source_consent_required:${source.id || 'unknown'}`);
    }
    if (source.rightsState === 'unknown' || source.rightsState === 'blocked') {
      errors.push(`source_rights_not_cleared:${source.id || 'unknown'}`);
    }
    if (source.private !== true) errors.push(`source_must_default_private:${source.id || 'unknown'}`);
  }

  const sceneIds = new Set<string>();
  for (const scene of input.scenes ?? []) {
    if (!clean(scene.id) || sceneIds.has(scene.id)) errors.push('scene_id_invalid_or_duplicate');
    sceneIds.add(scene.id);
    if (!clean(scene.title)) errors.push(`scene_title_required:${scene.id || 'unknown'}`);
    if (!Number.isInteger(scene.durationMs) || scene.durationMs < 250 || scene.durationMs > 3_600_000) {
      errors.push(`scene_duration_invalid:${scene.id || 'unknown'}`);
    }
    if (!Array.isArray(scene.sourceRefs) || scene.sourceRefs.length === 0) {
      errors.push(`scene_source_required:${scene.id || 'unknown'}`);
    }
    for (const ref of scene.sourceRefs ?? []) {
      if (!sourceIds.has(ref)) errors.push(`scene_source_missing:${scene.id || 'unknown'}:${ref}`);
    }

    if (input.executionMode === 'source-only' && !SOURCE_ONLY_TREATMENTS.has(scene.visualTreatment)) {
      errors.push(`source_only_scene_requires_provider:${scene.id || 'unknown'}`);
    }
  }

  if (input.executionMode === 'provider-assisted') {
    for (const source of input.sources ?? []) {
      if (source.rightsState !== 'derivative-use-cleared') {
        errors.push(`provider_derivative_rights_required:${source.id || 'unknown'}`);
      }
    }
  }

  return [...new Set(errors)];
}

export function buildLifeMovieLaunchPlan(
  input: LifeMoviePlanInput,
  env: Record<string, string | undefined> = process.env,
): LifeMovieLaunchPlan {
  const errors = validateLifeMoviePlan(input);
  const baseline = resolveStudioFeaturePolicy('life-movies', env);
  const providerEnhancement = resolveStudioFeaturePolicy('life-movies-provider-enhancement', env);
  const requiresProvider = lifeMovieRequiresProvider(input);
  const baselineExecutable = baseline.state === 'live' && baseline.activationAuthorized && !baseline.hardOff;
  const providerExecutable =
    providerEnhancement.state === 'live' &&
    providerEnhancement.activationAuthorized &&
    !providerEnhancement.hardOff;

  const canCreateDraft = errors.length === 0;
  const canStartRender =
    canCreateDraft &&
    baselineExecutable &&
    (!requiresProvider || providerExecutable);

  let state: LifeMovieLaunchPlan['state'] = 'invalid';
  if (canCreateDraft && requiresProvider && !providerExecutable) state = 'blocked-provider-hard-off';
  else if (canCreateDraft && canStartRender) state = 'ready-for-source-compose';
  else if (canCreateDraft) state = 'draft-ready';

  return {
    contractVersion: LIFE_MOVIES_CONTRACT_VERSION,
    projectType: LIFE_MOVIES_PROJECT_TYPE,
    canonicalCollection: LIFE_MOVIES_CANONICAL_COLLECTION,
    title: clean(input.title),
    storyMode: input.storyMode,
    executionMode: input.executionMode,
    outputProfile: LIFE_MOVIE_OUTPUT_PROFILES[input.outputProfile] ?? LIFE_MOVIE_OUTPUT_PROFILES['landscape-hd'],
    consentRefs: [...new Set(input.consentRefs.map(clean).filter(Boolean))],
    sources: input.sources,
    scenes: input.scenes,
    locale: clean(input.locale),
    spatialRequired: false,
    spatialDerivativeEligible: true,
    defaultPrivacy: 'private',
    renderBackend: requiresProvider ? 'asset-factory-provider-adapter' : 'deterministic-source-compose',
    providerSpendAuthorized: false,
    publicReleaseAuthorized: false,
    canCreateDraft,
    canStartRender,
    state,
    errors,
    featurePolicy: {
      baseline,
      providerEnhancement,
    },
  };
}

export function publicLifeMovieCapabilitySummary(env: Record<string, string | undefined> = process.env) {
  const baseline = resolveStudioFeaturePolicy('life-movies', env);
  const providerEnhancement = resolveStudioFeaturePolicy('life-movies-provider-enhancement', env);
  return {
    contractVersion: LIFE_MOVIES_CONTRACT_VERSION,
    projectType: LIFE_MOVIES_PROJECT_TYPE,
    canonicalCollection: LIFE_MOVIES_CANONICAL_COLLECTION,
    spatialRequired: false,
    ordinaryVideoPlayback: true,
    outputProfiles: Object.values(LIFE_MOVIE_OUTPUT_PROFILES),
    sourceOnly: {
      availableByArchitecture: true,
      executionAuthorized: baseline.state === 'live' && baseline.activationAuthorized && !baseline.hardOff,
    },
    providerAssisted: {
      availableByArchitecture: true,
      executionAuthorized:
        providerEnhancement.state === 'live' &&
        providerEnhancement.activationAuthorized &&
        !providerEnhancement.hardOff,
      spendAuthorizedBySource: false,
    },
    publicReleaseAuthorizedBySource: false,
    defaultPrivacy: 'private',
  } as const;
}
