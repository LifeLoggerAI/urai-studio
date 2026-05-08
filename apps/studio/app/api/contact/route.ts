import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProduction = process.env.NODE_ENV === 'production';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const message = cleanText(body?.message, 4000);

  if (body?.website) {
    return NextResponse.json({ ok: false, error: 'bot_rejected' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email) || message.length < 10) {
    return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
  }

  if (!adminDb) {
    const payload = {
      ok: !isProduction,
      persisted: false,
      error: 'persistence_unavailable',
      message: isProduction
        ? 'Contact persistence is unavailable. Submission was not stored.'
        : 'Demo mode: request validated but not persisted because Firebase Admin is not configured.',
    };
    return NextResponse.json(payload, { status: isProduction ? 503 : 202 });
  }

  await adminDb.collection('contact').add({
    email,
    message,
    name: cleanText(body?.name, 120) || null,
    projectType: cleanText(body?.projectType, 120) || null,
    source: 'urai-studio',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, persisted: true, message: 'Contact request stored.' });
}
