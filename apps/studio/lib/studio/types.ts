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
