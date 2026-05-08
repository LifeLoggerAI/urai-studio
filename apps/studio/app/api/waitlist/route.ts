import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProduction = process.env.NODE_ENV === 'production';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(body?.email);

  if (body?.website) {
    return NextResponse.json({ ok: false, error: 'bot_rejected' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  if (!adminDb) {
    const payload = {
      ok: !isProduction,
      persisted: false,
      error: 'persistence_unavailable',
      message: isProduction
        ? 'Waitlist persistence is unavailable. Submission was not stored.'
        : 'Demo mode: request validated but not persisted because Firebase Admin is not configured.',
    };
    return NextResponse.json(payload, { status: isProduction ? 503 : 202 });
  }

  const existing = await adminDb.collection('waitlist').where('email', '==', email).limit(1).get();

  if (!existing.empty) {
    return NextResponse.json({ ok: true, persisted: true, duplicate: true, message: 'Already on the waitlist.' });
  }

  await adminDb.collection('waitlist').add({
    email,
    name: typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : null,
    interest: typeof body?.interest === 'string' ? body.interest.trim().slice(0, 120) : null,
    source: 'urai-studio',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, persisted: true, duplicate: false, message: 'Waitlist request stored.' });
}
