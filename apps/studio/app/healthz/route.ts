import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type LivenessResponse = {
  ok: true;
  service: 'urai-studio';
  health: 'pass';
  type: 'liveness';
  timestamp: string;
};

export async function GET() {
  const body: LivenessResponse = {
    ok: true,
    service: 'urai-studio',
    health: 'pass',
    type: 'liveness',
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
