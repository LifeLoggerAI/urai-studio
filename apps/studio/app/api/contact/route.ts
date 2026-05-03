import { NextResponse } from 'next/server';
import { persistContact } from '@/lib/studio/intake';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = await persistContact(body);
  return result.ok ? NextResponse.json(result) : NextResponse.json(result, { status: result.status });
}
