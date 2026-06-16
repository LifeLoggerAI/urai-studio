export type StudioIntegrationStatus = 'configured' | 'missing';

export interface StudioIntegrationDiagnostic {
  id: string;
  label: string;
  url: string | null;
  status: StudioIntegrationStatus;
  required: boolean;
  envKeys: string[];
}

function envValue(...keys: string[]): string | null {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return null;
}

function integration(id: string, label: string, envKeys: string[], required = false): StudioIntegrationDiagnostic {
  const url = envValue(...envKeys);
  return {
    id,
    label,
    url,
    status: url ? 'configured' : 'missing',
    required,
    envKeys,
  };
}

export const studioIntegrations: StudioIntegrationDiagnostic[] = [
  integration('asset-factory', 'URAI Asset Factory', ['NEXT_PUBLIC_ASSET_FACTORY_URL'], true),
  integration('spatial', 'URAI Spatial', ['NEXT_PUBLIC_URAI_SPATIAL_URL'], true),
  integration('jobs', 'URAI Jobs', ['NEXT_PUBLIC_URAI_JOBS_URL']),
  integration('content', 'URAI Content', ['NEXT_PUBLIC_URAI_CONTENT_URL']),
  integration('analytics', 'URAI Analytics', ['NEXT_PUBLIC_URAI_ANALYTICS_URL'], true),
  integration('marketing', 'URAI Marketing', ['NEXT_PUBLIC_URAI_MARKETING_URL']),
  integration('admin', 'URAI Admin', ['NEXT_PUBLIC_URAI_ADMIN_URL'], true),
  integration('privacy', 'URAI Privacy', ['NEXT_PUBLIC_URAI_PRIVACY_URL'], true),
  integration('investors', 'URAI Investors', ['NEXT_PUBLIC_URAI_INVESTORS_URL']),
  integration('b2b-portal', 'B2B Portal', ['NEXT_PUBLIC_B2B_PORTAL_URL']),
];
