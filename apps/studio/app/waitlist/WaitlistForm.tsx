'use client';

import { useState, type FormEvent } from 'react';
import { readSubmissionResult } from '@/lib/public-submission-response';

export function WaitlistForm() {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setHasError(false);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const interest = String(formData.get('interest') || '').trim();
    const website = String(formData.get('website') || '');

    if (!email.includes('@')) {
      setIsSubmitting(false);
      setHasError(true);
      setMessage('Enter a valid email address.');
      return;
    }

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, interest, website }),
      });

      const body = await response.json().catch(() => null);
      const result = readSubmissionResult(response.ok, body);
      setHasError(!result.saved);
      setMessage(result.message);
      if (result.saved) form.reset();
    } catch {
      setHasError(true);
      setMessage('We could not confirm that you joined the waitlist. Your form has been kept so you can retry.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card form-card" aria-describedby="waitlist-status">
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

      <p id="waitlist-status" className="form-status" role={hasError ? 'alert' : 'status'}>
        {message}
      </p>
    </form>
  );
}
