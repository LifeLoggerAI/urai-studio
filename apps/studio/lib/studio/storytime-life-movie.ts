import type { LifeMovieNarrativeTheme } from './life-movies';

export type StorytimeScriptType =
  | 'daily_summary'
  | 'weekly_scroll'
  | 'relationship_reflection'
  | 'emotional_arc'
  | 'recovery_chapter'
  | 'memory_replay';

export type StorytimeLifeMovieEditorialBinding = {
  storySessionId: string;
  scriptType: StorytimeScriptType;
  narrativeTheme: LifeMovieNarrativeTheme;
  narratorScriptRef: string;
  emotionalArcRef?: string;
  relationshipThreadRef?: string;
  sourceRefs: string[];
  narrativeAuthorityRef: string;
};

const THEME_BY_SCRIPT: Record<StorytimeScriptType, LifeMovieNarrativeTheme> = {
  daily_summary: 'daily-reflection',
  weekly_scroll: 'weekly-recap',
  relationship_reflection: 'relationship-arc',
  emotional_arc: 'emotional-arc',
  recovery_chapter: 'recovery-arc',
  memory_replay: 'memory-replay',
};

export function lifeMovieThemeFromStorytimeScript(scriptType: StorytimeScriptType): LifeMovieNarrativeTheme {
  return THEME_BY_SCRIPT[scriptType];
}

export function createStorytimeLifeMovieEditorialBinding(input: {
  storySessionId: string;
  scriptType: StorytimeScriptType;
  narratorScriptRef: string;
  emotionalArcRef?: string;
  relationshipThreadRef?: string;
  sourceRefs: string[];
}): StorytimeLifeMovieEditorialBinding {
  if (!input.storySessionId.trim()) throw new Error('storytime_session_required');
  if (!input.narratorScriptRef.trim()) throw new Error('storytime_narrator_script_required');
  if (input.sourceRefs.length === 0) throw new Error('storytime_source_refs_required');
  if (input.scriptType === 'relationship_reflection' && !input.relationshipThreadRef?.trim()) {
    throw new Error('storytime_relationship_thread_required');
  }
  if (['emotional_arc', 'recovery_chapter'].includes(input.scriptType) && !input.emotionalArcRef?.trim()) {
    throw new Error('storytime_emotional_arc_required');
  }

  return {
    ...input,
    narrativeTheme: lifeMovieThemeFromStorytimeScript(input.scriptType),
    narrativeAuthorityRef: `storytime:${input.storySessionId}:${input.narratorScriptRef}`,
  };
}

export const STORYTIME_LIFE_MOVIE_AUTHORITY = {
  storyOwner: 'URAI Storytime',
  cinemaOwner: 'URAI Studio',
  storytimeOwns: ['story canon', 'narrator scripts', 'emotional arcs', 'relationship reflections'],
  studioOwns: ['shot planning', 'creative timeline', 'edit', 'score direction', 'motion direction', 'render review', 'finishing'],
  providerExecutionAuthorized: false,
  publicReleaseAuthorized: false,
} as const;
