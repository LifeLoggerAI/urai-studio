import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 4000;
const isProduction = process.env.NODE_ENV === 'production';

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

function normalizeMessage(value: unknown) {
  if (typeof value !== 'string') return null;
  const message = value.trim();
  if (message.length < 8 || message.length > MAX_MESSAGE_LENGTH) return null;
  return message;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (body?.website) return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });

  const email = normalizeEmail(body?.email);
  const message = normalizeMessage(body?.message);

  if (!email || !message) {
    return NextResponse.json(
      {
        ok: false,
        error: 'invalid_input',
        message: 'Provide a valid email address and a message between 8 and 4000 characters.',
      },
      { status: 400 },
    );
  }

  if (!adminDb) {
    const unavailableMessage = 'Contact persistence is not configured for this environment.';
    if (isProduction) {
      return NextResponse.json(
        { ok: false, persisted: false, error: 'persistence_unavailable', message: unavailableMessage },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, persisted: false, message: unavailableMessage });
  }

  await adminDb.collection('contact').add({
    email,
    message,
    source: 'urai-studio',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, persisted: true, message: 'Your message was sent to URAI Labs.' });
}
