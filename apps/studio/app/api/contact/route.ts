import { NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProduction = process.env.NODE_ENV === 'production';

type ApiError = {
  code?: string;
  message: string;
  details?: unknown;
};

type ContactResponse = {
  ok: boolean;
  status: string;
  persisted?: boolean;
  message?: string;
  data?: unknown;
  error?: ApiError;
  timestamp: string;
};

function json(body: Omit<ContactResponse, 'timestamp'>, status = 200) {
  return NextResponse.json(
    { ...body, timestamp: new Date().toISOString() },
    {
      status,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
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

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean) : [];
}

export async function POST(req: Request) {
  const rawBody = await req.json().catch(() => null);
  if (!rawBody) {
    return json({ ok: false, status: 'invalid_json', error: { code: 'invalid_json', message: 'Request body must be valid JSON.' } }, 400);
  }

  const body = asRecord(rawBody);
  const email = normalizeEmail(body.email);
  const name = normalizeText(body.name, 120);
  const company = normalizeText(body.company, 160);
  const useCase = normalizeText(body.useCase, 240);
  const budgetRange = normalizeText(body.budgetRange, 120);
  const timeline = normalizeText(body.timeline, 120);
  const interestedSystems = normalizeStringArray(body.interestedSystems);
  const subject = normalizeText(body.subject, 160) || 'URAI Studio contact request';
  const message = normalizeText(body.message, 5000);
  const website = normalizeText(body.website, 240);
  const source = normalizeText(body.source, 120) || 'urai-studio';

  if (website) {
    return json({ ok: false, status: 'bot_rejected', error: { code: 'bot_rejected', message: 'Submission rejected.' } }, 400);
  }

  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, status: 'invalid_email', error: { code: 'invalid_email', message: 'Please provide a valid email address.' } }, 400);
  }

  if (message.length < 10 || useCase.length < 4) {
    return json({ ok: false, status: 'invalid_message', error: { code: 'invalid_message', message: 'Please provide a clear use case and a message with at least 10 characters.' } }, 400);
  }

  const requestPayload = {
    name,
    email,
    company,
    useCase,
    budgetRange,
    timeline,
    interestedSystems,
    subject,
    message,
    source,
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  if (!adminDb) {
    return json(
      {
        ok: !isProduction,
        status: 'persistence_unavailable',
        persisted: false,
        error: isProduction ? { code: 'persistence_unavailable', message: 'Contact persistence is unavailable. Submission was not stored.' } : undefined,
        message: isProduction
          ? 'Contact persistence is unavailable. Submission was not stored.'
          : 'Demo mode: request validated but not persisted because Firebase Admin is not configured.',
        data: !isProduction ? requestPayload : undefined,
      },
      isProduction ? 503 : 202,
    );
  }

  const [contactRef, projectRef, integrationRef] = await Promise.all([
    adminDb.collection('contactRequests').add(requestPayload),
    adminDb.collection('projectRequests').add({
      name,
      email,
      company,
      useCase,
      desiredSystems: interestedSystems,
      budgetRange,
      timeline,
      createdAt: requestPayload.createdAt,
      status: 'new',
      source,
    }),
    adminDb.collection('integrationRequests').add({
      email,
      company,
      useCase,
      interestedSystems,
      createdAt: requestPayload.createdAt,
      status: 'new',
      source,
    }),
  ]);

  return json({
    ok: true,
    status: 'stored',
    persisted: true,
    message: 'Thanks. Your URAI Studio request was saved and is ready for review.',
    data: {
      contactRequestId: contactRef.id,
      projectRequestId: projectRef.id,
      integrationRequestId: integrationRef.id,
    },
  });
}
