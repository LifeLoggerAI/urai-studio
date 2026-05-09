import { NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProduction = process.env.NODE_ENV === 'production';

type WaitlistResponse = {
  ok: boolean;
  persisted?: boolean;
  duplicate?: boolean;
  error?: 'bot_rejected' | 'invalid_email' | 'persistence_unavailable' | 'invalid_json';
  message?: string;
};

function json(body: WaitlistResponse, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeOptionalText(value: unknown, maxLength = 120): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text.slice(0, maxLength) : null;
}

export async function POST(req: Request) {
  const rawBody = await req.json().catch(() => null);
  if (!rawBody) {
    return json({ ok: false, error: 'invalid_json', message: 'Request body must be valid JSON.' }, 400);
  }

  const body = asRecord(rawBody);
  const email = normalizeEmail(body.email);
  const name = normalizeOptionalText(body.name);
  const interest = normalizeOptionalText(body.interest);
  const website = typeof body.website === 'string' ? body.website.trim() : '';

  if (website) {
    return json({ ok: false, error: 'bot_rejected' }, 400);
  }

  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'invalid_email', message: 'Please provide a valid email address.' }, 400);
  }

  if (!adminDb) {
    return json(
      {
        ok: !isProduction,
        persisted: false,
        error: 'persistence_unavailable',
        message: isProduction
          ? 'Waitlist persistence is unavailable. Submission was not stored.'
          : 'Demo mode: request validated but not persisted because Firebase Admin is not configured.',
      },
      isProduction ? 503 : 202,
    );
  }

  const existing = await adminDb.collection('waitlist').where('email', '==', email).limit(1).get();

  if (!existing.empty) {
    return json({
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

  return json({
    ok: true,
    persisted: true,
    duplicate: false,
    message: 'Thanks. You are on the URAI Studio waitlist.',
  });
}
