import { NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase-admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProduction = process.env.NODE_ENV === 'production';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeOptionalText(value: unknown, maxLength = 120) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text.slice(0, maxLength) : null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const email = normalizeEmail(body?.email);
  const name = normalizeOptionalText(body?.name);
  const interest = normalizeOptionalText(body?.interest);
  const website = typeof body?.website === 'string' ? body.website.trim() : '';

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

  if (!adminDb) {
    return NextResponse.json(
      {
        ok: !isProduction,
        persisted: false,
        error: 'persistence_unavailable',
        message: isProduction
          ? 'Waitlist persistence is unavailable. Submission was not stored.'
          : 'Demo mode: request validated but not persisted because Firebase Admin is not configured.',
      },
      { status: isProduction ? 503 : 202 },
    );
  }

  const existing = await adminDb
    .collection('waitlist')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json({
      ok: true,
      persisted: true,
      duplicate: true,
      message: 'Already on the URAI Studio waitlist.',
    });
  }

  await adminDb.collection('waitlist').add({
    email,
    name,
    interest,
    source: 'urai-studio',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    persisted: true,
    duplicate: false,
    message: 'Thanks. You are on the URAI Studio waitlist.',
  });
}