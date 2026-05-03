export type IntegrationType = 'internal' | 'external' | 'hybrid';
export type ModuleStatus = 'live' | 'fallback' | 'mock' | 'disconnected';

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
  surfaceCategory: 'creative' | 'operations' | 'core';
}
