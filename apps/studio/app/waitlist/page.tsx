'use client';

import { useState } from 'react';

export default function WaitlistPage() {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
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

    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, interest, website }),
    });

    const result = await response.json().catch(() => ({ error: 'Unable to read the server response.' }));

    setIsSubmitting(false);
    setMessage(result.message || result.error || 'Thanks. You are on the list.');
    if (response.ok) form.reset();
  }

  return (
    <section className="narrow-page stack-xl" data-urai-studio-page="waitlist">
      <div className="section-heading">
        <p className="eyebrow">Early access</p>
        <h1>Join the URAI Studio waitlist.</h1>
        <p>
          Get updates as URAI Studio opens cinematic AI production systems, visual packages, spatial demos,
          and creator-facing tools across the URAI ecosystem.
        </p>
      </div>

      <form onSubmit={submit} className="card form-card">
        <label>
          Email
          <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
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
          {isSubmitting ? 'Joining…' : 'Join waitlist'}
        </button>

        <p className="form-status" role="status" aria-live="polite">
          {message}
        </p>
      </form>
    </section>
  );
}