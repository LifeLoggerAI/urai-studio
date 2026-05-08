'use client';

import { useState } from 'react';

type ContactState = 'idle' | 'submitting' | 'success' | 'error';

export function ContactForm() {
  const [message, setMessage] = useState('');
  const [state, setState] = useState<ContactState>('idle');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('submitting');
    setMessage('');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const body = String(formData.get('message') || '').trim();
    const website = String(formData.get('website') || '').trim();

    if (!email.includes('@') || body.length < 8) {
      setState('error');
      setMessage('Provide a valid email and a message with at least 8 characters.');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, message: body, website }),
      });
      const payload = await response.json();
      setState(response.ok ? 'success' : 'error');
      setMessage(payload.message || payload.error || 'Your request was received.');
    } catch {
      setState('error');
      setMessage('The contact endpoint is not reachable in this runtime. Email URAI Labs or retry after deployment.');
    }
  }

  return (
    <form onSubmit={submit} className="card" aria-describedby="contact-status">
      <label htmlFor="contact-email">
        <strong>Email</strong>
      </label>
      <input id="contact-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />

      <label htmlFor="contact-message">
        <strong>Project brief</strong>
      </label>
      <textarea
        id="contact-message"
        name="message"
        rows={6}
        placeholder="Tell us what you want URAI Studio to build, integrate, generate, or deploy."
        required
      />

      <label className="sr-only" htmlFor="contact-website">
        Website
      </label>
      <input id="contact-website" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <button className="button button-primary" type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Sending…' : 'Send Project Request'}
      </button>

      <p id="contact-status" role={state === 'error' ? 'alert' : 'status'}>
        {message || 'Use this form for production builds, enterprise integrations, demos, and launch support.'}
      </p>
    </form>
  );
}
