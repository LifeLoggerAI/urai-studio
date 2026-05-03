import { adminDb } from '@/lib/firebase-admin';
import { validateContactInput, validateWaitlistInput } from './schema';

type Fail = { ok: false; status: number; error: string };
type Success = { ok: true; persisted: boolean; message: string };

export async function persistWaitlist(input: unknown): Promise<Fail | Success> {
  const validated = validateWaitlistInput(input);
  if (!validated.ok) return { ok: false, status: 400, error: validated.error };
  if (adminDb) {
    await adminDb.collection('waitlist').add({ ...validated.data, source: 'urai-studio', createdAt: new Date().toISOString() });
    return { ok: true, persisted: true, message: 'Waitlist request stored.' };
  }
  return { ok: true, persisted: false, message: 'Request captured locally for demo (no server persistence configured).' };
}

export async function persistContact(input: unknown): Promise<Fail | Success> {
  const validated = validateContactInput(input);
  if (!validated.ok) return { ok: false, status: 400, error: validated.error };
  if (adminDb) {
    await adminDb.collection('contact').add({ ...validated.data, source: 'urai-studio', createdAt: new Date().toISOString() });
    return { ok: true, persisted: true, message: 'Contact request stored.' };
  }
  return { ok: true, persisted: false, message: 'Request captured locally for demo (no server persistence configured).' };
}
