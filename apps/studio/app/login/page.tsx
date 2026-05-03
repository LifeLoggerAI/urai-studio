'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [message, setMessage] = useState('');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '');

    if (!email.includes('@')) {
      setMessage('Please enter a valid email to continue.');
      return;
    }

    setMessage('Auth integration is available when Firebase Auth is configured.');
  }

  return (
    <section>
      <h1>Sign in to URAI Studio</h1>
      <p>Private by design. Council autonomy remains OFF by default.</p>

      <form onSubmit={onSubmit} className="card">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
        <button type="submit">Continue</button>
      </form>

      {message ? <p>{message}</p> : null}
    </section>
  );
}