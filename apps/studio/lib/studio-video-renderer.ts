import { DEFAULT_VIDEO_FACTORY_TEMPLATE_ID, buildVideoFactoryPrompt, getVideoFactoryTemplate, sumShotDurationsSeconds, validateVideoFactoryManifest, type VideoFactoryManifest, type VideoFactoryShot } from '@/lib/studio-video-factory';
import type { StudioExportKind, UraiId } from '@/lib/urai-system-contract';

export type VideoFactoryRenderMode = 'contract-only' | 'playwright-ffmpeg';

export type VideoFactoryRouteCaptureStep = {
  id: string;
  route: string;
  label: string;
  captureMode: VideoFactoryManifest['routeCaptures'][number]['captureMode'];
  outputPath: string;
  notes: string;
};

export type VideoFactoryTimelineShot = {
  id: string;
  startSecond: number;
  endSecond: number;
  durationSeconds: number;
  routeCaptureId: string;
  route: string;
  caption: string;
  cameraDirection: string;
  assetPromptIds: readonly string[];
};

export type VideoFactoryRenderArtifact = {
  kind: StudioExportKind;
  filename: string;
  contentType: string;
  storagePath: string;
  status: 'planned' | 'rendered' | 'queued';
  notes: string;
};

export type VideoFactoryRenderPackage = {
  ok: true;
  mode: VideoFactoryRenderMode;
  contractOnly: boolean;
  templateId: string;
  manifestId: string;
  title: string;
  durationSeconds: number;
  aspectRatios: VideoFactoryManifest['aspectRatios'];
  outputBasePath: string;
  routeCapturePlan: VideoFactoryRouteCaptureStep[];
  timeline: VideoFactoryTimelineShot[];
  subtitleText: string;
  exportManifest: {
    version: 1;
    templateId: string;
    manifestId: string;
    title: string;
    durationSeconds: number;
    requestedExports: StudioExportKind[];
    publishTargets: string[];
    shots: VideoFactoryTimelineShot[];
    voiceover: VideoFactoryManifest['voiceover'];
    assetPrompts: VideoFactoryManifest['assetPrompts'];
  };
  artifacts: VideoFactoryRenderArtifact[];
  prompt: string;
  commandPlan: string[];
};

export type BuildVideoFactoryRenderPackageInput = {
  templateId?: string;
  projectId?: UraiId;
  mode?: VideoFactoryRenderMode;
  prompt?: string;
};

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function timestamp(seconds: number) {
  const wholeSeconds = Math.floor(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const secs = wholeSeconds % 60;
  return [hours, minutes, secs].map((part) => String(part).padStart(2, '0')).join(':') + ',000';
}

function buildTimeline(manifest: VideoFactoryManifest): VideoFactoryTimelineShot[] {
  let cursor = 0;
  const routeById = new Map(manifest.routeCaptures.map((capture) => [capture.id, capture.route]));

  return manifest.shots.map((shot: VideoFactoryShot) => {
    const startSecond = cursor;
    const endSecond = cursor + shot.durationSeconds;
    cursor = endSecond;

    return {
      id: shot.id,
      startSecond,
      endSecond,
      durationSeconds: shot.durationSeconds,
      routeCaptureId: shot.routeCaptureId,
      route: routeById.get(shot.routeCaptureId) ?? 'unknown-route',
      caption: shot.caption,
      cameraDirection: shot.cameraDirection,
      assetPromptIds: shot.assetPromptIds,
    };
  });
}

function buildSubtitleText(timeline: VideoFactoryTimelineShot[]) {
  return timeline
    .map((shot, index) => [String(index + 1), `${timestamp(shot.startSecond)} --> ${timestamp(shot.endSecond)}`, shot.caption].join('\n'))
    .join('\n\n');
}

function contentTypeForExport(kind: StudioExportKind) {
  if (kind === 'mp4') return 'video/mp4';
  if (kind === 'srt') return 'application/x-subrip';
  if (kind === 'json') return 'application/json';
  return 'application/octet-stream';
}

function filenameForExport(templateId: string, kind: StudioExportKind) {
  const base = slug(templateId);
  if (kind === 'json') return `${base}.render-manifest.json`;
  if (kind === 'srt') return `${base}.captions.srt`;
  return `${base}.${kind}`;
}

export function buildVideoFactoryRenderPackage(input: BuildVideoFactoryRenderPackageInput = {}): VideoFactoryRenderPackage {
  const templateId = input.templateId ?? DEFAULT_VIDEO_FACTORY_TEMPLATE_ID;
  const manifest = getVideoFactoryTemplate(templateId);

  if (!manifest) {
    throw new Error(`unknown_video_factory_template:${templateId}`);
  }

  const validation = validateVideoFactoryManifest(manifest);
  if (!validation.ok) {
    throw new Error(`invalid_video_factory_manifest:${validation.errors.join(',')}`);
  }

  const durationSeconds = sumShotDurationsSeconds(manifest);
  const outputBasePath = `studio/video-factory/${manifest.templateId}`;
  const timeline = buildTimeline(manifest);
  const subtitleText = buildSubtitleText(timeline);
  const mode = input.mode ?? 'contract-only';

  const routeCapturePlan = manifest.routeCaptures.map((capture) => ({
    id: capture.id,
    route: capture.route,
    label: capture.label,
    captureMode: capture.captureMode,
    outputPath: `${outputBasePath}/captures/${capture.id}.webm`,
    notes: capture.notes,
  }));

  const artifacts = manifest.requestedExports.map((kind) => ({
    kind,
    filename: filenameForExport(manifest.templateId, kind),
    contentType: contentTypeForExport(kind),
    storagePath: `${outputBasePath}/exports/${filenameForExport(manifest.templateId, kind)}`,
    status: 'planned' as const,
    notes:
      kind === 'mp4'
        ? 'Planned final video export. Contract-only mode records the path and render instructions; playwright-ffmpeg mode renders the binary.'
        : 'Generated deterministically from the Video Factory manifest.',
  }));

  return {
    ok: true,
    mode,
    contractOnly: mode === 'contract-only',
    templateId: manifest.templateId,
    manifestId: manifest.id,
    title: manifest.title,
    durationSeconds,
    aspectRatios: manifest.aspectRatios,
    outputBasePath,
    routeCapturePlan,
    timeline,
    subtitleText,
    exportManifest: {
      version: 1,
      templateId: manifest.templateId,
      manifestId: manifest.id,
      title: manifest.title,
      durationSeconds,
      requestedExports: [...manifest.requestedExports],
      publishTargets: [...manifest.publishTargets],
      shots: timeline,
      voiceover: manifest.voiceover,
      assetPrompts: manifest.assetPrompts,
    },
    artifacts,
    prompt: buildVideoFactoryPrompt(manifest, input.prompt),
    commandPlan: [
      'capture each route in routeCapturePlan exactly once unless a shot intentionally reuses the same capture',
      'render timeline in order from manifest.shots',
      'write subtitleText to the planned srt artifact path',
      'write exportManifest to the planned json artifact path',
      'compose captured footage, captions, and generated assets into the planned mp4 artifact path',
      'never capture both / and /home for this template; /home is canonical',
    ],
  };
}
