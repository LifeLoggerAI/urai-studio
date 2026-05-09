import { NextResponse } from 'next/server';

import { studioModules } from '@/lib/studio/modules';
import { systemCapabilities, type SystemCapability } from '@/lib/studio/types';

export const dynamic = 'force-dynamic';

type SystemCapabilitiesResponse = {
  ok: true;
  service: 'urai-studio';
  capabilities: readonly SystemCapability[];
  count: number;
  modules: Array<{
    id: string;
    route: string;
    capabilities: string[];
  }>;
  generatedAt: string;
};

export async function GET() {
  const body: SystemCapabilitiesResponse = {
    ok: true,
    service: 'urai-studio',
    capabilities: systemCapabilities,
    count: systemCapabilities.length,
    modules: studioModules.map((module) => ({
      id: module.id,
      route: module.route,
      capabilities: module.capabilities,
    })),
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
