'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const name = String(formData.get('name') || '').trim();
    const projectType = String(formData.get('projectType') || '').trim();
    const body = String(formData.get('message') || '').trim();
    const website = String(formData.get('website') || '');

    if (!email.includes('@') || body.length < 12) {
      setIsSubmitting(false);
      setMessage('Please provide a valid email and a project note with at least 12 characters.');
      return;
    }

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, name, projectType, message: body, website }),
    });

    const result = await response.json().catch(() => ({ error: 'Unable to read the server response.' }));

    setIsSubmitting(false);
    setMessage(result.message || result.error || 'Thanks. Your request was received.');
    if (response.ok) form.reset();
  }

  return (
    <section className="narrow-page stack-xl">
      <div className="section-heading">
        <p className="eyebrow">Contact</p>
        <h1>Start a URAI Studio project.</h1>
        <p>
          Share the creative system, website, motion package, cinematic demo, symbolic visual package, or spatial
          experience you want to build. Firebase persistence is used when server credentials are configured; otherwise
          local/demo environments return a safe fallback.
        </p>
      </div>

      <form onSubmit={submit} className="card form-card">
        <label>
          Name
          <input name="name" autoComplete="name" placeholder="Your name" />
        </label>

        <label>
          Email <span aria-hidden="true">*</span>
          <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </label>

        <label>
          Project type
          <select name="projectType" defaultValue="">
            <option value="" disabled>
              Select one
            </option>
            <option>Website / launch page</option>
            <option>Cinematic demo</option>
            <option>Motion / visual system</option>
            <option>Spatial / WebXR prototype</option>
            <option>URAI ecosystem integration</option>
          </select>
        </label>

        <label>
          Project note <span aria-hidden="true">*</span>
          <textarea name="message" placeholder="Tell us what you want to build." minLength={12} required />
        </label>

        <input name="website" className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />

        <button className="button button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send project request'}
        </button>

        <p className="form-status" role="status" aria-live="polite">
          {message}
        </p>
      </form>
    </section>
  );
}