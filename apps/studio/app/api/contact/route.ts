import { NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase-admin';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || '').trim().toLowerCase();
  const message = String(body?.message || '').trim();
  const name = String(body?.name || '').trim();
  const projectType = String(body?.projectType || '').trim();
  const website = String(body?.website || '');

  if (website) {
    return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
  }

  if (!emailPattern.test(email) || message.length < 12) {
    return NextResponse.json(
      { ok: false, error: 'Please provide a valid email and a project note with at least 12 characters.' },
      { status: 400 },
    );
  }

  const payload = {
    email,
    name,
    projectType,
    message,
    source: 'urai-studio',
    createdAt: new Date().toISOString(),
  };

  if (adminDb) {
    await adminDb.collection('contact').add(payload);
    return NextResponse.json({ ok: true, persisted: true, message: 'Thanks. Your project request was stored.' });
  }

  return NextResponse.json({
    ok: true,
    persisted: false,
    message: 'Thanks. Your request was received, but server persistence is not configured in this environment.',
  });
}
