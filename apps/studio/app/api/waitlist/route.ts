import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const isProduction = process.env.NODE_ENV === 'production';

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (body?.website) return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });

  const email = normalizeEmail(body?.email);
  if (!email) {
    return NextResponse.json(
      { ok: false, error: 'invalid_email', message: 'Enter a valid email address.' },
      { status: 400 },
    );
  }

  if (!adminDb) {
    const message = 'Waitlist persistence is not configured for this environment.';
    if (isProduction) {
      return NextResponse.json({ ok: false, persisted: false, error: 'persistence_unavailable', message }, { status: 503 });
    }

    return NextResponse.json({ ok: true, persisted: false, message });
  }

  await adminDb.collection('waitlist').doc(email).set(
    {
      email,
      source: 'urai-studio',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true, persisted: true, message: 'You are on the URAI Studio waitlist.' });
}
