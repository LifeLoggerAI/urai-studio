import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="studio-system-state">
      <div className="studio-system-state__content">
        <div className="studio-system-state__mark" aria-hidden="true" />
        <p className="eyebrow">URAI Studio</p>
        <h1>That studio view isn’t available</h1>
        <p>The address may have changed, or the work may have moved to another part of the studio.</p>
        <div className="studio-system-state__actions">
          <Link className="button button-primary" href="/">Studio home</Link>
        </div>
      </div>
    </section>
  );
}
