export type StudioIntegrationStatus = 'configured' | 'missing';

export interface StudioIntegrationDiagnostic {
  id: string;
  url: string | null;
  status: StudioIntegrationStatus;
  required: boolean;
}

function envValue(key: string): string | null {
  const value = process.env[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function integration(id: string, envKey: string, required = false): StudioIntegrationDiagnostic {
  const url = envValue(envKey);
  return {
    id,
    url,
    status: url ? 'configured' : 'missing',
    required,
  };
}

export const studioIntegrations: StudioIntegrationDiagnostic[] = [
  integration('asset-factory', 'NEXT_PUBLIC_ASSET_FACTORY_URL', true),
  integration('spatial', 'NEXT_PUBLIC_URAI_SPATIAL_URL'),
  integration('analytics', 'NEXT_PUBLIC_URAI_ANALYTICS_URL'),
  integration('admin', 'NEXT_PUBLIC_URAI_ADMIN_URL'),
];
