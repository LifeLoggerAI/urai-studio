import { NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase-admin';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || '').trim().toLowerCase();
  const interest = String(body?.interest || '').trim();
  const website = String(body?.website || '');

  if (website) {
    return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
  }

  if (!emailPattern.test(email)) {
    return NextResponse.json({ ok: false, error: 'Please provide a valid email address.' }, { status: 400 });
  }

  const payload = {
    email,
    interest,
    source: 'urai-studio',
    createdAt: new Date().toISOString(),
  };

  if (adminDb) {
    await adminDb.collection('waitlist').add(payload);
    return NextResponse.json({ ok: true, persisted: true, message: 'Thanks. You are on the URAI Studio waitlist.' });
  }

  return NextResponse.json({
    ok: true,
    persisted: false,
    message: 'Thanks. You are on the list, but server persistence is not configured in this environment.',
  });
}
