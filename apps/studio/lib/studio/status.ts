import { firebaseAdminStatus } from '@/lib/firebase-admin';
import { studioConfig } from './config';
import { studioModules } from './modules';
import type { ModuleStatus } from './types';

export type ReadinessCheck = {
  id: string;
  required: boolean;
  ok: boolean;
  detail: string | null;
  error?: string | null;
};

export type ReadinessSummary = {
  ok: boolean;
  status: 'ready' | 'degraded';
  checks: ReadinessCheck[];
  blockers: string[];
  warnings: string[];
};

export type ModuleStatusSummary = {
  id: string;
  name: string;
  status: ModuleStatus;
  route: string;
  enabled: boolean;
  productionCritical: boolean;
};

function envValue(...keys: string[]): string | null {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return null;
}

export function statusWarnings(): string[] {
  const warnings: string[] = [];

  if (!envValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID')) {
    warnings.push('firebase_project_unconfigured');
  }

  if (!envValue('NEXT_PUBLIC_ASSET_FACTORY_URL', 'ASSET_FACTORY_INTERNAL_URL')) {
    warnings.push('asset_factory_unconfigured');
  }

  if (!firebaseAdminStatus.ready) {
    warnings.push('firebase_admin_unavailable');
  }

  if (!envValue('NEXT_PUBLIC_SITE_URL')) {
    warnings.push('public_site_url_using_default');
  }

  return warnings;
}

export function readinessChecks(): ReadinessCheck[] {
  const firebaseProjectId = envValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID');
  const assetFactoryUrl = envValue('NEXT_PUBLIC_ASSET_FACTORY_URL', 'ASSET_FACTORY_INTERNAL_URL');
  const siteUrl = envValue('NEXT_PUBLIC_SITE_URL') ?? studioConfig.siteUrl;

  return [
    {
      id: 'firebase-project',
      required: true,
      ok: Boolean(firebaseProjectId),
      detail: firebaseProjectId,
    },
    {
      id: 'firebase-admin-persistence',
      required: process.env.NODE_ENV === 'production',
      ok: firebaseAdminStatus.ready,
      detail: firebaseAdminStatus.mode,
      error: firebaseAdminStatus.error,
    },
    {
      id: 'asset-factory-url',
      required: false,
      ok: Boolean(assetFactoryUrl),
      detail: assetFactoryUrl,
    },
    {
      id: 'public-site-url',
      required: false,
      ok: Boolean(siteUrl),
      detail: siteUrl,
    },
  ];
}

export function readinessSummary(): ReadinessSummary {
  const checks = readinessChecks();
  const blockers = checks.filter((check) => check.required && !check.ok);

  return {
    ok: blockers.length === 0,
    status: blockers.length === 0 ? 'ready' : 'degraded',
    checks,
    blockers: blockers.map((check) => check.id),
    warnings: statusWarnings(),
  };
}

export function moduleStatuses(): ModuleStatusSummary[] {
  return studioModules.map((module) => ({
    id: module.id,
    name: module.name,
    status: module.status,
    route: module.route,
    enabled: module.enabled,
    productionCritical: module.productionCritical,
  }));
}
