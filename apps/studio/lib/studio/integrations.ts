export type StudioIntegrationStatus = 'configured' | 'missing';

export interface StudioIntegrationDiagnostic {
  id: string;
  url: string | null;
  status: StudioIntegrationStatus;
  required: boolean;
}

function envValue(...keys: string[]): string | null {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return null;
}

function integration(id: string, envKeys: string | string[], required = false): StudioIntegrationDiagnostic {
  const keys = Array.isArray(envKeys) ? envKeys : [envKeys];
  const url = envValue(...keys);
  return {
    id,
    url,
    status: url ? 'configured' : 'missing',
    required,
  };
}

export const studioIntegrations: StudioIntegrationDiagnostic[] = [
  integration('asset-factory', ['NEXT_PUBLIC_ASSET_FACTORY_URL', 'ASSET_FACTORY_INTERNAL_URL'], true),
  integration('spatial', 'NEXT_PUBLIC_URAI_SPATIAL_URL'),
  integration('analytics', 'NEXT_PUBLIC_URAI_ANALYTICS_URL'),
  integration('admin', 'NEXT_PUBLIC_URAI_ADMIN_URL'),
];
