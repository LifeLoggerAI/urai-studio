import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ApiHealthResponse = {
  ok: true;
  service: 'urai-studio';
  type: 'api-health';
  timestamp: string;
};

export async function GET() {
  const body: ApiHealthResponse = {
    ok: true,
    service: 'urai-studio',
    type: 'api-health',
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
