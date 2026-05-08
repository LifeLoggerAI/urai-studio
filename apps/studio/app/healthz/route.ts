import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, service: 'urai-studio', health: 'pass', type: 'liveness' });
}
