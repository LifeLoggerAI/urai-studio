import { firebaseAdminStatus } from '@/lib/firebase-admin';
import { studioModules } from './modules';

export function statusWarnings() {
  const warnings: string[] = [];

  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !process.env.FIREBASE_PROJECT_ID) {
    warnings.push('firebase_project_unconfigured');
  }

  if (!process.env.NEXT_PUBLIC_ASSET_FACTORY_URL && !process.env.ASSET_FACTORY_INTERNAL_URL) {
    warnings.push('asset_factory_unconfigured');
  }

  if (!firebaseAdminStatus.ready) {
    warnings.push('firebase_admin_unavailable');
  }

  return warnings;
}

export function readinessChecks() {
  return [
    {
      id: 'firebase-project',
      required: true,
      ok: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID),
      detail: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || null,
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
      ok: Boolean(process.env.NEXT_PUBLIC_ASSET_FACTORY_URL || process.env.ASSET_FACTORY_INTERNAL_URL),
      detail: process.env.NEXT_PUBLIC_ASSET_FACTORY_URL || process.env.ASSET_FACTORY_INTERNAL_URL || null,
    },
    {
      id: 'public-site-url',
      required: process.env.NODE_ENV === 'production',
      ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      detail: process.env.NEXT_PUBLIC_SITE_URL || null,
    },
  ];
}

export function readinessSummary() {
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

export const moduleStatuses = () => studioModules.map((m) => ({ id: m.id, status: m.status, route: m.route }));
