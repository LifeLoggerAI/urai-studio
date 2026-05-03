export interface WaitlistInput { email: string; website?: string }
export interface ContactInput extends WaitlistInput { message: string }

export function validateWaitlistInput(input: unknown): { ok: true; data: WaitlistInput } | { ok: false; error: string } {
  const body = input as Record<string, unknown> | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const website = typeof body?.website === 'string' ? body.website.trim() : '';
  if (!email.includes('@')) return { ok: false, error: 'invalid_email' };
  if (website) return { ok: false, error: 'spam_detected' };
  return { ok: true, data: { email } };
}

export function validateContactInput(input: unknown): { ok: true; data: ContactInput } | { ok: false; error: string } {
  const waitlistResult = validateWaitlistInput(input);
  if (!waitlistResult.ok) return waitlistResult;
  const body = input as Record<string, unknown>;
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (message.length < 8) return { ok: false, error: 'invalid_message' };
  return { ok: true, data: { ...waitlistResult.data, message } };
}
