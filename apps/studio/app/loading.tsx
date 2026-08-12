export default function Loading() {
  return (
    <section className="studio-system-state" aria-busy="true" aria-live="polite">
      <div className="studio-system-state__content">
        <div className="studio-system-state__mark" data-animate="true" aria-hidden="true" />
        <p className="eyebrow">URAI Studio</p>
        <h1>Opening the studio</h1>
        <p>Preparing the creative environment and the work that is ready to view.</p>
      </div>
    </section>
  );
}
