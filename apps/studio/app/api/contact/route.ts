import { NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase-admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProduction = process.env.NODE_ENV === 'production';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const email = normalizeEmail(body?.email);
  const name = normalizeText(body?.name, 120) || null;
  const subject = normalizeText(body?.subject, 160) || 'URAI Studio contact request';
  const message = normalizeText(body?.message, 4000);
  const website = normalizeText(body?.website, 240);

  if (website) {
    return NextResponse.json(
      { ok: false, error: 'bot_rejected' },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_email', message: 'Please provide a valid email address.' },
      { status: 400 },
    );
  }

  if (message.length < 10) {
    return NextResponse.json(
      { ok: false, error: 'invalid_message', message: 'Please provide a message with at least 10 characters.' },
      { status: 400 },
    );
  }

  if (!adminDb) {
    return NextResponse.json(
      {
        ok: !isProduction,
        persisted: false,
        error: 'persistence_unavailable',
        message: isProduction
          ? 'Contact persistence is unavailable. Submission was not stored.'
          : 'Demo mode: request validated but not persisted because Firebase Admin is not configured.',
      },
      { status: isProduction ? 503 : 202 },
    );
  }

  await adminDb.collection('contactMessages').add({
    email,
    name,
    subject,
    message,
    source: 'urai-studio',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    persisted: true,
    message: 'Thanks. Your message was received.',
  });
}
