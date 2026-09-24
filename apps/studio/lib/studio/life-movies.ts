import { createHash } from 'node:crypto';

import type { StudioExportKind, UraiId } from '@/lib/urai-system-contract';

export type LifeMovieSourceKind = 'photo' | 'video' | 'audio' | 'transcript' | 'memory' | 'storytime' | 'replay';
export type LifeMovieProvenanceState =
  | 'original-source'
  | 'user-provided-fact'
  | 'verified-metadata'
  | 'user-recorded-memory'
  | 'inferred'
  | 'reconstructed'
  | 'generated'
  | 'artistic-interpretation'
  | 'unknown';

export type LifeMovieMode =
  | 'chronological'
  | 'thematic'
  | 'documentary'
  | 'family-history'
  | 'legacy'
  | 'user-directed';

export type LifeMovieSource = {
  id: string;
  kind: LifeMovieSourceKind;
  uri: string;
  mimeType?: string;
  title?: string;
  startsAt?: string;
  endsAt?: string;
  durationMs?: number;
  provenance: LifeMovieProvenanceState;
  sourceRefs: string[];
  consentRef: string;
  ownerOrRightsRef: string;
};

export type LifeMovieChapter = {
  id: string;
  title: string;
  sourceIds: string[];
  narration?: string;
  durationMs: number;
};

export type LifeMovieProject = {
  schemaVersion: 1;
  id: UraiId;
  tenantId: UraiId;
  userId: UraiId;
  title: string;
  mode: LifeMovieMode;
  sources: LifeMovieSource[];
  chapters: LifeMovieChapter[];
  requestedExports: StudioExportKind[];
  spatialRequired: false;
  privateByDefault: true;
  publicReleaseAuthorized: false;
  providerGenerationAuthorized: false;
  createdAt: string;
};

export type LifeMovieTimelineItem = {
  chapterId: string;
  sourceId: string;
  startMs: number;
  endMs: number;
  provenance: LifeMovieProvenanceState;
};

export type LifeMovieRenderPlan = {
  schemaVersion: 1;
  projectId: UraiId;
  timeline: LifeMovieTimelineItem[];
  subtitleText: string;
  requestedExports: StudioExportKind[];
  renderEngine: 'ffmpeg-worker';
  spatialRequired: false;
  providerGenerationRequired: boolean;
  providerGenerationAuthorized: false;
  inputDigest: string;
};

const DOCUMENT_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function safeSegment(value: string, field: string) {
  if (!DOCUMENT_SEGMENT.test(value)) throw new Error(`invalid_${field}`);
  return value;
}

function safeUri(value: string) {
  if (!value || value.includes('..')) throw new Error('invalid_source_uri');
  if (/^(https?|gs):\/\//.test(value) || value.startsWith('studios/')) return value;
  throw new Error('unsupported_source_uri');
}

function timestamp(ms: number) {
  const total = Math.max(0, Math.floor(ms));
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const millis = total % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

export function validateLifeMovieProject(project: LifeMovieProject) {
  safeSegment(project.id, 'project_id');
  safeSegment(project.tenantId, 'tenant_id');
  safeSegment(project.userId, 'user_id');
  if (!project.title.trim()) throw new Error('life_movie_title_required');
  if (project.sources.length === 0) throw new Error('life_movie_sources_required');
  if (project.chapters.length === 0) throw new Error('life_movie_chapters_required');
  if (project.spatialRequired !== false) throw new Error('life_movie_spatial_must_be_optional');
  if (project.publicReleaseAuthorized !== false) throw new Error('life_movie_public_release_must_start_off');
  if (project.providerGenerationAuthorized !== false) throw new Error('life_movie_provider_generation_must_start_off');

  const sourceIds = new Set<string>();
  for (const source of project.sources) {
    safeSegment(source.id, 'source_id');
    safeUri(source.uri);
    if (sourceIds.has(source.id)) throw new Error(`duplicate_life_movie_source:${source.id}`);
    sourceIds.add(source.id);
    if (!source.consentRef) throw new Error(`source_consent_required:${source.id}`);
    if (!source.ownerOrRightsRef) throw new Error(`source_rights_required:${source.id}`);
    if (source.sourceRefs.length === 0) throw new Error(`source_provenance_required:${source.id}`);
  }

  const chapterIds = new Set<string>();
  for (const chapter of project.chapters) {
    safeSegment(chapter.id, 'chapter_id');
    if (chapterIds.has(chapter.id)) throw new Error(`duplicate_life_movie_chapter:${chapter.id}`);
    chapterIds.add(chapter.id);
    if (chapter.durationMs <= 0 || !Number.isFinite(chapter.durationMs)) throw new Error(`invalid_chapter_duration:${chapter.id}`);
    if (chapter.sourceIds.length === 0) throw new Error(`chapter_sources_required:${chapter.id}`);
    for (const sourceId of chapter.sourceIds) {
      if (!sourceIds.has(sourceId)) throw new Error(`unknown_chapter_source:${chapter.id}:${sourceId}`);
    }
  }

  if (!project.requestedExports.includes('mp4') || !project.requestedExports.includes('srt') || !project.requestedExports.includes('json')) {
    throw new Error('life_movie_required_exports_missing');
  }

  return project;
}

export function buildLifeMovieRenderPlan(project: LifeMovieProject): LifeMovieRenderPlan {
  validateLifeMovieProject(project);
  const sourceById = new Map(project.sources.map((source) => [source.id, source]));
  const timeline: LifeMovieTimelineItem[] = [];
  const subtitleBlocks: string[] = [];
  let cursorMs = 0;
  let subtitleIndex = 1;

  for (const chapter of project.chapters) {
    const perSourceMs = Math.max(1000, Math.floor(chapter.durationMs / chapter.sourceIds.length));
    for (const sourceId of chapter.sourceIds) {
      const source = sourceById.get(sourceId)!;
      const startMs = cursorMs;
      const endMs = startMs + perSourceMs;
      timeline.push({ chapterId: chapter.id, sourceId, startMs, endMs, provenance: source.provenance });
      cursorMs = endMs;
    }
    if (chapter.narration?.trim()) {
      const chapterStart = timeline.find((item) => item.chapterId === chapter.id)?.startMs ?? 0;
      const chapterEnd = timeline.filter((item) => item.chapterId === chapter.id).at(-1)?.endMs ?? chapterStart + chapter.durationMs;
      subtitleBlocks.push([
        String(subtitleIndex++),
        `${timestamp(chapterStart)} --> ${timestamp(chapterEnd)}`,
        chapter.narration.trim(),
      ].join('\n'));
    }
  }

  const canonical = JSON.stringify({
    projectId: project.id,
    sources: project.sources.map(({ id, uri, provenance, sourceRefs, consentRef, ownerOrRightsRef }) => ({
      id, uri, provenance, sourceRefs: [...sourceRefs].sort(), consentRef, ownerOrRightsRef,
    })),
    chapters: project.chapters,
    requestedExports: [...project.requestedExports].sort(),
  });

  const providerGenerationRequired = project.sources.some((source) =>
    ['reconstructed', 'generated', 'artistic-interpretation'].includes(source.provenance),
  );

  return {
    schemaVersion: 1,
    projectId: project.id,
    timeline,
    subtitleText: subtitleBlocks.join('\n\n'),
    requestedExports: project.requestedExports,
    renderEngine: 'ffmpeg-worker',
    spatialRequired: false,
    providerGenerationRequired,
    providerGenerationAuthorized: false,
    inputDigest: createHash('sha256').update(canonical).digest('hex'),
  };
}

export function createLifeMovieProject(input: {
  id: UraiId;
  tenantId: UraiId;
  userId: UraiId;
  title: string;
  mode: LifeMovieMode;
  sources: LifeMovieSource[];
  chapters: LifeMovieChapter[];
  now?: string;
}): LifeMovieProject {
  return validateLifeMovieProject({
    schemaVersion: 1,
    id: input.id,
    tenantId: input.tenantId,
    userId: input.userId,
    title: input.title.trim(),
    mode: input.mode,
    sources: input.sources,
    chapters: input.chapters,
    requestedExports: ['mp4', 'srt', 'json'],
    spatialRequired: false,
    privateByDefault: true,
    publicReleaseAuthorized: false,
    providerGenerationAuthorized: false,
    createdAt: input.now ?? new Date().toISOString(),
  });
}
