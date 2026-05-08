import { NextResponse } from 'next/server';

import { studioConfig } from '@/lib/studio/config';
import { studioIntegrations } from '@/lib/studio/integrations';
import { studioModules } from '@/lib/studio/modules';
import { systemCapabilities } from '@/lib/studio/types';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'urai-studio',
    name: 'URAI Studio',
    version: studioConfig.version ?? '0.1.0',
    description: 'Premium creative operating system for generated media, cinematic interfaces, spatial storytelling, and URAI system-of-systems operations.',
    domain: 'https://www.uraistudio.com',
    appRoot: 'apps/studio',
    routes: studioModules.map((module) => module.route),
    modules: studioModules,
    capabilities: systemCapabilities,
    integrations: studioIntegrations,
    deployment: { hosting: 'firebase', canonical: 'https://www.uraistudio.com' },
    persistenceMode: 'firebase',
    fallbackActive: true,
  });
}
