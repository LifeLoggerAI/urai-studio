import { NextResponse } from 'next/server';

import { systemCapabilities } from '@/lib/studio/types';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'urai-studio',
    capabilities: systemCapabilities,
  });
}
