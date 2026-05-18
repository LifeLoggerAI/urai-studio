import { NextResponse } from 'next/server';

import { studioConfig } from '@/lib/studio/config';
import { firebaseDiagnostics } from '@/lib/studio/firebase';
import { studioIntegrations, type StudioIntegrationDiagnostic } from '@/lib/studio/integrations';
import { studioModules } from '@/lib/studio/modules';
import { readinessSummary } from '@/lib/studio/status';
import { systemCapabilities, type StudioModule, type SystemCapability } from '@/lib/studio/types';

export const dynamic = 'force-dynamic';

type SystemManifestResponse = {
  ok: boolean;
  service: 'urai-studio';
  name: 'URAI Studio';
  version: string;
  description: string;
  domain: string;
  appRoot: 'apps/studio';
  routes: string[];
  modules: StudioModule[];
  capabilities: readonly SystemCapability[];
  integrations: StudioIntegrationDiagnostic[];
  deployment: {
    hosting: 'firebase';
    canonical: string;
  };
  persistenceMode: 'firebase';
  fallbackActive: boolean;
  firebase: typeof firebaseDiagnostics;
  generatedAt: string;
};

export async function GET() {
  const readiness = readinessSummary();
  const canonical = studioConfig.siteUrl ?? 'https://www.uraistudio.com';
  const body: SystemManifestResponse = {
    ok: readiness.ok,
    service: 'urai-studio',
    name: 'URAI Studio',
    version: studioConfig.version,
    description:
      'Premium creative operating system for generated media, cinematic interfaces, spatial storytelling, and URAI system-of-systems operations.',
    domain: canonical,
    appRoot: 'apps/studio',
    routes: Array.from(new Set(studioModules.map((module) => module.route))).sort(),
    modules: studioModules,
    capabilities: systemCapabilities,
    integrations: studioIntegrations,
    deployment: { hosting: 'firebase', canonical },
    persistenceMode: 'firebase',
    fallbackActive: !readiness.ok,
    firebase: firebaseDiagnostics,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
