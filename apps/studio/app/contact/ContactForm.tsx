'use client';

import { type FormEvent, useState } from 'react';

type ContactState = 'idle' | 'submitting' | 'success' | 'error';

const systems = ['Campaign sprint', 'Launch film', 'Music visual', 'Product visual', 'Social content system', 'Brand world', 'AI character campaign', 'Monthly retainer'];

export function ContactForm() {
  const [message, setMessage] = useState('');
  const [state, setState] = useState<ContactState>('idle');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('submitting');
    setMessage('Saving your request to the URAI Studio project intake layer...');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      useCase: String(formData.get('useCase') || '').trim(),
      budgetRange: String(formData.get('budgetRange') || '').trim(),
      timeline: String(formData.get('timeline') || '').trim(),
      interestedSystems: formData.getAll('interestedSystems').map(String),
      message: String(formData.get('message') || '').trim(),
      website: String(formData.get('website') || '').trim(),
      source: 'urai-studio-project-intake',
      formType: 'project',
      sourceDomain: 'uraistudio.com',
    };

    if (!payload.email.includes('@') || payload.message.length < 10 || payload.useCase.length < 4) {
      setState('error');
      setMessage('Add a valid email, a clear project type, and a project message with at least 10 characters.');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      setState(response.ok ? 'success' : 'error');
      setMessage(result.message || result.error?.message || 'Your request was received.');
      if (response.ok) form.reset();
    } catch {
      setState('error');
      setMessage('The project intake endpoint is not reachable in this runtime. Retry after deployment or email URAI Studio directly.');
    }
  }

  return (
    <form onSubmit={submit} className="card form-card" aria-describedby="contact-status">
      <label htmlFor="contact-name">
        <strong>Name</strong>
        <input id="contact-name" name="name" type="text" placeholder="Your name" autoComplete="name" />
      </label>

      <label htmlFor="contact-email">
        <strong>Email</strong>
        <input id="contact-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
      </label>

      <label htmlFor="contact-company">
        <strong>Company or brand</strong>
        <input id="contact-company" name="company" type="text" placeholder="Company, artist, product, or project name" autoComplete="organization" />
      </label>

      <label htmlFor="contact-use-case">
        <strong>Project type</strong>
        <select id="contact-use-case" name="useCase" required defaultValue="">
          <option value="" disabled>Select a project type</option>
          <option>Cinematic AI campaign</option>
          <option>Launch film or trailer</option>
          <option>Music visual</option>
          <option>Product visual</option>
          <option>Short-form social content system</option>
          <option>Custom brand world</option>
          <option>AI character campaign</option>
          <option>Monthly creative retainer</option>
        </select>
      </label>

      <div className="grid two compact-grid">
        <label htmlFor="contact-budget">
          <strong>Budget range</strong>
          <select id="contact-budget" name="budgetRange" defaultValue="">
            <option value="">Not sure yet</option>
            <option>$1k - $5k</option>
            <option>$5k - $15k</option>
            <option>$15k - $50k</option>
            <option>$50k+</option>
          </select>
        </label>
        <label htmlFor="contact-timeline">
          <strong>Timeline</strong>
          <select id="contact-timeline" name="timeline" defaultValue="">
            <option value="">Flexible</option>
            <option>ASAP</option>
            <option>30 days</option>
            <option>60-90 days</option>
            <option>Strategic roadmap</option>
          </select>
        </label>
      </div>

      <fieldset className="system-checkboxes">
        <legend>Interested deliverables</legend>
        <div className="checkbox-grid">
          {systems.map((system) => (
            <label key={system}>
              <input type="checkbox" name="interestedSystems" value={system} />
              <span>{system}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor="contact-message">
        <strong>Project brief</strong>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          placeholder="Tell us what you want URAI Studio to create, launch, visualize, package, or produce."
          required
        />
      </label>

      <label className="sr-only" htmlFor="contact-website">
        Website
      </label>
      <input id="contact-website" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <button className="button button-primary" type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Submitting...' : 'Start a Project'}
      </button>

      <p id="contact-status" role={state === 'error' ? 'alert' : 'status'} className={`form-status status-${state}`}>
        {message || 'Use this form for Studio projects, production packages, content systems, launch films, and brand worlds.'}
      </p>
    </form>
  );
}
