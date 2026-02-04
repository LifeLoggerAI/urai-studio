
import { NextResponse } from 'next/server';
import { requestReplay } from '@/lib/firestoreStudio';
import { requireSession } from '@/lib/authServer';

export async function POST(req: Request) {
  const { session } = await requireSession(req);
  const { jobId } = await req.json();

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  const result = await requestReplay(jobId);

  return NextResponse.json(result);
}
