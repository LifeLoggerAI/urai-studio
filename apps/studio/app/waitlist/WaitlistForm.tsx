'use client';

import { useState, type FormEvent } from 'react';

export function WaitlistForm() {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const interest = String(formData.get('interest') || '').trim();
    const website = String(formData.get('website') || '');

    if (!email.includes('@')) {
      setIsSubmitting(false);
      setMessage('Enter a valid email address.');
      return;
    }

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, interest, website }),
      });

      const result = await response.json().catch(() => ({ error: 'Unable to read the server response.' }));
      setMessage(result.message || result.error || 'Thanks. You are on the list.');
      if (response.ok) form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to join the waitlist right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card form-card">
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>

      <label>
        What are you most interested in?
        <select name="interest" defaultValue="">
          <option value="" disabled>
            Select one
          </option>
          <option>URAI Studio launch</option>
          <option>Motion and visual systems</option>
          <option>Cinematic demo production</option>
          <option>Spatial storytelling</option>
          <option>Partnerships / investment</option>
        </select>
      </label>

      <input name="website" className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Joining...' : 'Join waitlist'}
      </button>

      <p className="form-status" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
