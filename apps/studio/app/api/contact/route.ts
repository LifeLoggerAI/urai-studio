import { NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProduction = process.env.NODE_ENV === 'production';

type ContactResponse = {
  ok: boolean;
  persisted?: boolean;
  error?: 'bot_rejected' | 'invalid_email' | 'invalid_message' | 'persistence_unavailable' | 'invalid_json';
  message?: string;
};

function json(body: ContactResponse, status = 200) {
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

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(req: Request) {
  const rawBody = await req.json().catch(() => null);
  if (!rawBody) {
    return json({ ok: false, error: 'invalid_json', message: 'Request body must be valid JSON.' }, 400);
  }

  const body = asRecord(rawBody);
  const email = normalizeEmail(body.email);
  const name = normalizeText(body.name, 120) || null;
  const subject = normalizeText(body.subject, 160) || 'URAI Studio contact request';
  const message = normalizeText(body.message, 4000);
  const website = normalizeText(body.website, 240);

  if (website) {
    return json({ ok: false, error: 'bot_rejected' }, 400);
  }

  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'invalid_email', message: 'Please provide a valid email address.' }, 400);
  }

  if (message.length < 10) {
    return json({ ok: false, error: 'invalid_message', message: 'Please provide a message with at least 10 characters.' }, 400);
  }

  if (!adminDb) {
    return json(
      {
        ok: !isProduction,
        persisted: false,
        error: 'persistence_unavailable',
        message: isProduction
          ? 'Contact persistence is unavailable. Submission was not stored.'
          : 'Demo mode: request validated but not persisted because Firebase Admin is not configured.',
      },
      isProduction ? 503 : 202,
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

  return json({
    ok: true,
    persisted: true,
    message: 'Thanks. Your message was received.',
  });
}
