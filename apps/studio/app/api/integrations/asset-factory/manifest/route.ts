import { NextResponse } from 'next/server';

import { getAssetFactoryManifest } from '@/lib/integrations/assetFactory';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getAssetFactoryManifest();

  return NextResponse.json(result, {
    status: result.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
