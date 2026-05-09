export type IntegrationType = 'internal' | 'external' | 'hybrid';
export type ModuleStatus = 'live' | 'fallback' | 'mock' | 'disconnected';
export type SurfaceCategory = 'creative' | 'operations' | 'core';

export interface StudioModule {
  id: string;
  name: string;
  description: string;
  route: string;
  status: ModuleStatus;
  healthEndpoint?: string;
  firebaseProjectId?: string;
  hostingUrl?: string;
  integrationType: IntegrationType;
  enabled: boolean;
  requiredEnv: string[];
  owner: string;
  surfaceCategory: SurfaceCategory;
  inputs: string[];
  outputs: string[];
  capabilities: string[];
  fallbackBehavior: string;
  productionCritical: boolean;
}

export const systemCapabilities = [
  'studio-dashboard','asset-factory-control','creative-module-registry','spatial-integration','motion-pipeline','cinema-pipeline','music-pipeline','visuals-pipeline','analytics-view','admin-control','system-health','usage-reporting','integration-contract','openapi-manifest',
] as const;

export type SystemCapability = (typeof systemCapabilities)[number];

export type StudioMode = 'demo' | 'user' | 'campaign' | 'therapeutic' | 'vr' | 'social';

export type StudioAssetType =
  | 'image'
  | 'video'
  | 'audio'
  | 'script'
  | 'subtitle'
  | 'scroll'
  | 'scene'
  | 'model'
  | 'other';

export type StudioStatus = 'draft' | 'queued' | 'processing' | 'ready' | 'failed' | 'archived';

export interface StudioProject {
  id: string;
  uid: string;
  title: string;
  mode: StudioMode;
  sourceRefs: string[];
  scenes: string[];
  narrationStyle: string;
  visualStyle: string;
  exportStatus: StudioStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudioScene {
  id: string;
  uid: string;
  projectId: string;
  order: number;
  title: string;
  description: string;
  durationSeconds: number;
  assetRefs: string[];
  narrationRef?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudioAsset {
  id: string;
  uid: string;
  title: string;
  type: StudioAssetType;
  status: StudioStatus;
  source: 'upload' | 'generated' | 'imported' | 'system';
  storagePath: string;
  publicUrl?: string | null;
  thumbnailUrl?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AssetJob {
  id: string;
  uid: string;
  projectId?: string | null;
  type: StudioAssetType;
  status: StudioStatus;
  prompt: string;
  outputAssetId?: string | null;
  error?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AssetCollection {
  id: string;
  uid: string;
  title: string;
  assetIds: string[];
  isPublic?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudioScroll {
  id: string;
  uid: string;
  projectId: string;
  title: string;
  sceneIds: string[];
  status: StudioStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface NarratorScript {
  id: string;
  uid: string;
  projectId: string;
  sceneId?: string;
  title: string;
  body: string;
  style: string;
  status: StudioStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SubtitleTrack {
  id: string;
  uid: string;
  projectId: string;
  format: 'srt' | 'vtt' | 'json';
  body: string;
  status: StudioStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VoiceoverJob {
  id: string;
  uid: string;
  projectId: string;
  scriptId: string;
  status: StudioStatus;
  storagePath?: string;
  error?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExportJob {
  id: string;
  uid: string;
  projectId: string;
  type: string;
  exportStatus: StudioStatus;
  manifest?: Record<string, unknown> | null;
  storagePath?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudioEvent {
  id: string;
  uid: string;
  type: string;
  projectId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudioFeatureFlags {
  callablesEnabled: boolean;
  uploadsEnabled: boolean;
  exportsEnabled: boolean;
  xrPreviewEnabled: boolean;
  demoSeedEnabled: boolean;
}

export interface StudioDashboardSummary {
  ok: boolean;
  projects: StudioProject[];
  assets: StudioAsset[];
  scrolls: StudioScroll[];
  exports: ExportJob[];
}
