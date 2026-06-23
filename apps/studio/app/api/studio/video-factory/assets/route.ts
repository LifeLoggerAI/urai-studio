import { NextResponse } from 'next/server';

import { URAI_REPLAY_TEASER_TEMPLATE } from '@/lib/studio-video-factory';
import { getAssetFactoryHealth, getAssetFactoryManifest } from '@/lib/integrations/assetFactory';

export async function GET() {
  const assetPrompts = Array.from(
    new Map(URAI_REPLAY_TEASER_TEMPLATE.assetPrompts.map((asset) => [asset.id, asset])).values(),
  );

  const [health, manifest] = await Promise.all([getAssetFactoryHealth(), getAssetFactoryManifest()]);

  return NextResponse.json({
    ok: true,
    templateId: URAI_REPLAY_TEASER_TEMPLATE.templateId,
    assetCount: assetPrompts.length,
    assetPrompts,
    assetFactory: {
      health,
      manifest,
      integration: health.ok ? 'available' : 'blocked-or-unconfigured',
    },
  });
}
