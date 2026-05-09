import { NextResponse } from 'next/server';

import { getAssetFactoryHealth } from '@/lib/integrations/assetFactory';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await getAssetFactoryHealth();

  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
