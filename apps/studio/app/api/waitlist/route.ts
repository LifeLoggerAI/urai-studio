import { NextResponse } from 'next/server';
import { persistWaitlist } from '@/lib/studio/intake';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = await persistWaitlist(body);
  return result.ok ? NextResponse.json(result) : NextResponse.json(result, { status: result.status });
}
