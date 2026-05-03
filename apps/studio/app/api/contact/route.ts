import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b?.email || !b?.message || b?.website) return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });

  if (adminDb) {
    await adminDb.collection('contact').add({ email: String(b.email).toLowerCase(), message: String(b.message), source: 'urai-studio', createdAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, persisted: true, message: 'Contact request stored.' });
  }

  return NextResponse.json({ ok: true, persisted: false, message: 'Request captured locally for demo (no server persistence configured).' });
}
