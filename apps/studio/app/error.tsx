"use client";

import Link from 'next/link';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="studio-system-state" role="alert">
      <div className="studio-system-state__content">
        <div className="studio-system-state__mark" aria-hidden="true" />
        <p className="eyebrow">URAI Studio</p>
        <h1>This view was interrupted</h1>
        <p>Your work was not changed. Try opening the view again, or return to the studio home.</p>
        <div className="studio-system-state__actions">
          <button className="button button-primary" type="button" onClick={reset}>Try again</button>
          <Link className="button button-secondary" href="/">Studio home</Link>
        </div>
      </div>
    </section>
  );
}
