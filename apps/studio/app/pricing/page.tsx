import Link from 'next/link';

const tiers = [
  { name: 'Creator', price: 'Project-based', detail: 'Launch visuals, brand assets, and guided creative production briefs.' },
  { name: 'Studio Pro', price: 'Retainer', detail: 'Recurring cinematic assets, dashboards, render workflows, and system integration support.' },
  { name: 'Enterprise', price: 'Custom', detail: 'Private creative infrastructure, API workflows, governance, security review, and rollout planning.' },
];

export default function PricingPage() {
  return (
    <section data-urai-studio-page="pricing">
      <p className="eyebrow">Pricing</p>
      <h1>Premium creative systems, scoped honestly.</h1>
      <p>
        URAI Studio packages are intentionally consultative until billing and Stripe checkout are configured.
        No fake checkout links are exposed on this production surface.
      </p>

      <div className="grid feature-grid">
        {tiers.map((tier) => (
          <article className="card" key={tier.name}>
            <h2>{tier.name}</h2>
            <strong>{tier.price}</strong>
            <p>{tier.detail}</p>
            <Link className="button button-primary" href="/contact">Start conversation</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
