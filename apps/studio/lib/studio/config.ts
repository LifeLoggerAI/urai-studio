export type StudioEnvironment = 'development' | 'test' | 'production' | string;

export interface StudioConfig {
  service: 'urai-studio';
  name: 'URAI Studio';
  version: string;
  environment: StudioEnvironment;
  firebaseProjectId: string;
  hostingSite: string;
  siteUrl: string | null;
}

function envValue(key: string): string | null {
  const value = process.env[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function runtimeProjectId(): string | null {
  return (
    envValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID') ??
    envValue('FIREBASE_PROJECT_ID') ??
    envValue('GOOGLE_CLOUD_PROJECT') ??
    envValue('GCLOUD_PROJECT')
  );
}

export const studioConfig: StudioConfig = {
  service: 'urai-studio',
  name: 'URAI Studio',
  version: envValue('npm_package_version') ?? '0.1.0',
  environment: envValue('NODE_ENV') ?? 'development',
  firebaseProjectId: runtimeProjectId() ?? 'unconfigured',
  hostingSite: envValue('NEXT_PUBLIC_HOSTING_SITE') ?? 'urai-studio',
  siteUrl: envValue('NEXT_PUBLIC_SITE_URL'),
};
