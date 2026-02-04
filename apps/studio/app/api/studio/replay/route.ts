
import { NextResponse } from 'next/server';
import { requestReplay } from '../../../../lib/firestoreStudio';
import { requireSession } from '../../../../lib/authServer';

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { jobId } = body;

  if (!jobId || typeof jobId !== 'string') {
    return NextResponse.json({ ok: false, error: 'jobId is required' }, { status: 400 });
  }

  try {
    const result = await requestReplay(jobId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error requesting replay:', error);
    return NextResponse.json({ ok: false, error: 'Failed to request replay' }, { status: 500 });
  }
}
