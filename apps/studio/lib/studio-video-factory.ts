import type { StudioExportKind, StudioJobKind, UraiId } from '@/lib/urai-system-contract';

export const DEFAULT_VIDEO_FACTORY_TEMPLATE_ID = 'urai-replay-teaser-v1' as const;

export const VIDEO_FACTORY_EXPORTS = ['mp4', 'srt', 'json'] as const satisfies readonly StudioExportKind[];

export type VideoFactoryAspectRatio = '9:16' | '16:9' | '1:1';

export type VideoFactoryRouteCapture = {
  id: string;
  route: string;
  label: string;
  captureMode: 'browser' | 'spatial-camera';
  notes: string;
};

export type VideoFactoryAssetPrompt = {
  id: string;
  kind: 'image' | 'storyboard' | 'scene_manifest' | 'subtitle' | 'script';
  title: string;
  prompt: string;
};

export type VideoFactoryShot = {
  id: string;
  durationSeconds: number;
  routeCaptureId: string;
  assetPromptIds: readonly string[];
  caption: string;
  cameraDirection: string;
};

export type VideoFactoryVoiceoverBeat = {
  startSecond: number;
  endSecond: number;
  line: string;
};

export type VideoFactoryManifest = {
  id: string;
  templateId: string;
  title: string;
  description: string;
  durationSeconds: number;
  aspectRatios: readonly VideoFactoryAspectRatio[];
  jobKind: StudioJobKind;
  requestedExports: readonly StudioExportKind[];
  spatialSource: 'urai-spatial';
  routeCaptures: readonly VideoFactoryRouteCapture[];
  assetPrompts: readonly VideoFactoryAssetPrompt[];
  shots: readonly VideoFactoryShot[];
  voiceover: readonly VideoFactoryVoiceoverBeat[];
  publishTargets: readonly string[];
  defaultPrompt: string;
};

export type VideoFactoryValidation = {
  ok: boolean;
  errors: string[];
};

export type BuildVideoFactoryJobInput = {
  templateId?: string;
  projectId?: UraiId;
  prompt?: string;
};

export type BuildVideoFactoryJobResult = {
  template: VideoFactoryManifest;
  kind: StudioJobKind;
  projectId?: UraiId;
  prompt: string;
  requestedExports: StudioExportKind[];
};

export const URAI_REPLAY_TEASER_TEMPLATE: VideoFactoryManifest = {
  id: 'video_factory_manifest_urai_replay_teaser_v1',
  templateId: DEFAULT_VIDEO_FACTORY_TEMPLATE_ID,
  title: 'URAI Replay Teaser',
  description:
    'A thirty-second proof-of-world teaser showing Home World into Life Map, Focus, Replay, Passport, and Status without duplicating / and /home capture.',
  durationSeconds: 30,
  aspectRatios: ['9:16', '16:9', '1:1'],
  jobKind: 'video_generation',
  requestedExports: VIDEO_FACTORY_EXPORTS,
  spatialSource: 'urai-spatial',
  assetPrompts: [
    {
      id: 'asset_opening_title_card',
      kind: 'image',
      title: 'Opening title card',
      prompt: 'Cinematic URAI title frame: Own your life. Step inside yourself. Dark spatial world, living orb, premium launch teaser energy.',
    },
    {
      id: 'asset_orb_motion_board',
      kind: 'storyboard',
      title: 'Orb motion board',
      prompt: 'Storyboard the URAI orb opening into a normal chat while remaining embodied inside the private Home World.',
    },
    {
      id: 'asset_replay_subtitles',
      kind: 'subtitle',
      title: 'Replay teaser subtitles',
      prompt: 'Generate punchy captions timed to each shot for a thirty-second vertical-first URAI Replay teaser.',
    },
    {
      id: 'asset_export_manifest',
      kind: 'scene_manifest',
      title: 'Render export manifest',
      prompt: 'Produce a render manifest that references captured URAI Spatial routes, generated assets, voiceover beats, subtitles, and export formats.',
    },
  ],
  routeCaptures: [
    {
      id: 'capture_home_world',
      route: '/home',
      label: 'Home World',
      captureMode: 'spatial-camera',
      notes: 'Use /home as the canonical Home World capture. Do not also capture / for this template.',
    },
    {
      id: 'capture_life_map',
      route: '/life-map',
      label: 'Life Map',
      captureMode: 'spatial-camera',
      notes: 'Ascend from Home World into the memory galaxy and star field.',
    },
    {
      id: 'capture_focus',
      route: '/focus?memoryId=quiet-reset',
      label: 'Focus Chamber',
      captureMode: 'browser',
      notes: 'Selected-memory room that proves a star opens into a focused memory state.',
    },
    {
      id: 'capture_replay',
      route: '/replay?manifestId=replay-recovery-thread&memoryId=quiet-reset',
      label: 'Replay Chamber',
      captureMode: 'browser',
      notes: 'Cinematic memory replay proof shot with pause/restart/return affordances.',
    },
    {
      id: 'capture_passport',
      route: '/passport',
      label: 'Passport',
      captureMode: 'browser',
      notes: 'Ownership, identity, provenance, consent, and export permission proof.',
    },
    {
      id: 'capture_status',
      route: '/status',
      label: 'Status',
      captureMode: 'browser',
      notes: 'World online proof and readiness close.',
    },
  ],
  shots: [
    {
      id: 'shot_threshold',
      durationSeconds: 4,
      routeCaptureId: 'capture_home_world',
      assetPromptIds: ['asset_opening_title_card', 'asset_orb_motion_board'],
      caption: 'Your life should not be trapped in apps.',
      cameraDirection: 'Start low in the Home World, drift toward the orb, reveal the private threshold.',
    },
    {
      id: 'shot_orb_chat',
      durationSeconds: 4,
      routeCaptureId: 'capture_home_world',
      assetPromptIds: ['asset_orb_motion_board'],
      caption: 'Your AI should live inside your world.',
      cameraDirection: 'Tap the orb, open the chat layer, keep the world visible behind it.',
    },
    {
      id: 'shot_ascent',
      durationSeconds: 5,
      routeCaptureId: 'capture_life_map',
      assetPromptIds: ['asset_export_manifest'],
      caption: 'Your memories become places.',
      cameraDirection: 'Ascend from ground into cloud and galaxy, then push toward a memory star.',
    },
    {
      id: 'shot_selected_memory',
      durationSeconds: 4,
      routeCaptureId: 'capture_focus',
      assetPromptIds: ['asset_export_manifest'],
      caption: 'One star opens a room.',
      cameraDirection: 'Enter the focused memory chamber and hold long enough to show selected-memory proof.',
    },
    {
      id: 'shot_replay',
      durationSeconds: 6,
      routeCaptureId: 'capture_replay',
      assetPromptIds: ['asset_replay_subtitles', 'asset_export_manifest'],
      caption: 'The room becomes a replay.',
      cameraDirection: 'Move through the replay chamber, show cinematic beats and control affordances.',
    },
    {
      id: 'shot_ownership',
      durationSeconds: 4,
      routeCaptureId: 'capture_passport',
      assetPromptIds: ['asset_export_manifest'],
      caption: 'You own the world. You control the data.',
      cameraDirection: 'Cut cleanly to Passport, highlighting consent, identity, and export boundaries.',
    },
    {
      id: 'shot_online',
      durationSeconds: 3,
      routeCaptureId: 'capture_status',
      assetPromptIds: ['asset_opening_title_card'],
      caption: 'URAI is online.',
      cameraDirection: 'Close on live route/status proof, then fade back to the orb and title.',
    },
  ],
  voiceover: [
    { startSecond: 0, endSecond: 4, line: 'What if your life was not scattered across apps?' },
    { startSecond: 4, endSecond: 8, line: 'What if your AI lived inside your private world?' },
    { startSecond: 8, endSecond: 13, line: 'Your memories become a map you can enter.' },
    { startSecond: 13, endSecond: 17, line: 'A single star opens into focus.' },
    { startSecond: 17, endSecond: 23, line: 'Focus becomes replay. Replay becomes meaning.' },
    { startSecond: 23, endSecond: 27, line: 'Your identity, consent, and ownership stay with you.' },
    { startSecond: 27, endSecond: 30, line: 'URAI. Own your life. Step inside yourself.' },
  ],
  publishTargets: ['tiktok', 'reels', 'youtube-shorts', 'x', 'launch-page'],
  defaultPrompt:
    'Create the first URAI Replay teaser from the canonical thirty-second manifest. Use the existing URAI Spatial route captures once each, generated asset prompts, voiceover beats, subtitles, and mp4/srt/json exports.',
};

export const URAI_VIDEO_FACTORY_TEMPLATES = [URAI_REPLAY_TEASER_TEMPLATE] as const satisfies readonly VideoFactoryManifest[];

export function getVideoFactoryTemplate(templateId: string = DEFAULT_VIDEO_FACTORY_TEMPLATE_ID) {
  return URAI_VIDEO_FACTORY_TEMPLATES.find((template) => template.templateId === templateId);
}

export function sumShotDurationsSeconds(manifest: VideoFactoryManifest) {
  return manifest.shots.reduce((total, shot) => total + shot.durationSeconds, 0);
}

function duplicateValues(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return [...duplicates];
}

export function validateVideoFactoryManifest(manifest: VideoFactoryManifest): VideoFactoryValidation {
  const errors: string[] = [];
  const routeCaptureIds = manifest.routeCaptures.map((capture) => capture.id);
  const routeCaptureRoutes = manifest.routeCaptures.map((capture) => capture.route);
  const assetPromptIds = manifest.assetPrompts.map((asset) => asset.id);
  const shotIds = manifest.shots.map((shot) => shot.id);
  const shotDurationSeconds = sumShotDurationsSeconds(manifest);

  for (const duplicate of duplicateValues(routeCaptureIds)) {
    errors.push(`duplicate_route_capture_id:${duplicate}`);
  }

  for (const duplicate of duplicateValues(routeCaptureRoutes)) {
    errors.push(`duplicate_route_capture_route:${duplicate}`);
  }

  for (const duplicate of duplicateValues(assetPromptIds)) {
    errors.push(`duplicate_asset_prompt_id:${duplicate}`);
  }

  for (const duplicate of duplicateValues(shotIds)) {
    errors.push(`duplicate_shot_id:${duplicate}`);
  }

  if (routeCaptureRoutes.includes('/') && routeCaptureRoutes.includes('/home')) {
    errors.push('duplicate_home_capture:/+/home');
  }

  if (shotDurationSeconds !== manifest.durationSeconds) {
    errors.push(`duration_mismatch:${shotDurationSeconds}/${manifest.durationSeconds}`);
  }

  for (const shot of manifest.shots) {
    if (!routeCaptureIds.includes(shot.routeCaptureId)) {
      errors.push(`unknown_route_capture:${shot.id}:${shot.routeCaptureId}`);
    }

    for (const assetPromptId of shot.assetPromptIds) {
      if (!assetPromptIds.includes(assetPromptId)) {
        errors.push(`unknown_asset_prompt:${shot.id}:${assetPromptId}`);
      }
    }
  }

  if (manifest.jobKind !== 'video_generation') {
    errors.push(`invalid_job_kind:${manifest.jobKind}`);
  }

  for (const exportKind of VIDEO_FACTORY_EXPORTS) {
    if (!manifest.requestedExports.includes(exportKind)) {
      errors.push(`missing_export:${exportKind}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function buildVideoFactoryPrompt(manifest: VideoFactoryManifest, overridePrompt?: string) {
  const shots = manifest.shots
    .map((shot, index) => `${index + 1}. ${shot.id} (${shot.durationSeconds}s): ${shot.caption} ${shot.cameraDirection}`)
    .join('\n');
  const routes = manifest.routeCaptures.map((capture) => `${capture.id}: ${capture.route} — ${capture.notes}`).join('\n');
  const voiceover = manifest.voiceover.map((beat) => `${beat.startSecond}-${beat.endSecond}s: ${beat.line}`).join('\n');

  return [
    overridePrompt?.trim() || manifest.defaultPrompt,
    '',
    `Template: ${manifest.templateId}`,
    `Title: ${manifest.title}`,
    `Duration: ${manifest.durationSeconds} seconds`,
    `Exports: ${manifest.requestedExports.join(', ')}`,
    '',
    'Route captures, use once each unless the shot list references the same capture intentionally:',
    routes,
    '',
    'Shot list:',
    shots,
    '',
    'Voiceover beats:',
    voiceover,
    '',
    'Guardrail: do not capture both / and /home for this teaser. /home is the canonical Home World route.',
  ].join('\n');
}

export function buildVideoFactoryJobRequest(input: BuildVideoFactoryJobInput = {}): BuildVideoFactoryJobResult {
  const template = getVideoFactoryTemplate(input.templateId);

  if (!template) {
    throw new Error(`unknown_video_factory_template:${input.templateId}`);
  }

  const validation = validateVideoFactoryManifest(template);
  if (!validation.ok) {
    throw new Error(`invalid_video_factory_manifest:${validation.errors.join(',')}`);
  }

  return {
    template,
    kind: template.jobKind,
    projectId: input.projectId,
    prompt: buildVideoFactoryPrompt(template, input.prompt),
    requestedExports: [...template.requestedExports],
  };
}
