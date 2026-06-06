import { NextResponse } from 'next/server';

import { URAI_SYSTEM_CONTRACT, URAI_SYSTEM_CONTRACT_VERSION } from '@/lib/urai-system-contract';
import { studioConfig } from '@/lib/studio/config';

export const dynamic = 'force-dynamic';

type UraiContractResponse = {
  ok: true;
  service: 'urai-studio';
  contractVersion: typeof URAI_SYSTEM_CONTRACT_VERSION;
  appRoot: 'apps/studio';
  domain: string;
  contract: typeof URAI_SYSTEM_CONTRACT;
  generatedAt: string;
};

export async function GET() {
  const canonical = studioConfig.siteUrl ?? 'https://www.uraistudio.com';
  const body: UraiContractResponse = {
    ok: true,
    service: 'urai-studio',
    contractVersion: URAI_SYSTEM_CONTRACT_VERSION,
    appRoot: 'apps/studio',
    domain: canonical,
    contract: URAI_SYSTEM_CONTRACT,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
