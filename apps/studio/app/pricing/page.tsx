import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Creator, Studio Pro, and Enterprise pricing paths for URAI Studio.',
};

const tiers = [
  {
    name: 'Creator',
    price: 'Project-based',
    description: 'For individual creators validating cinematic AI workflows, launch visuals, and brand assets.',
    features: [
      'Studio dashboard access',
      'Feature-gated generation intake',
      'Asset and job visibility',
      'Guided creative production briefs',
      'Privacy-first defaults',
    ],
  },
  {
    name: 'Studio Pro',
    price: 'Retainer',
    description: 'For production teams building repeatable visual, motion, cinema, and music pipelines.',
    features: [
      'Multi-module operations',
      'Asset Factory handoff contract',
      'Recurring cinematic assets',
      'Usage and analytics surfaces',
      'Priority implementation planning',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For organizations integrating URAI Studio into internal creative systems.',
    features: [
      'Integration contract support',
      'Admin and compliance readiness',
      'Private deployment planning',
      'API and system-of-systems roadmap',
      'Governance, security review, and rollout planning',
    ],
  },
];

export default function PricingPage() {
  const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);

  return (
    <section data-urai-studio-page="pricing" className="page-stack">
      <p className="eyebrow">Pricing</p>
      <h1>Plans for creators, studios, and enterprise systems.</h1>
      <p className="hero-lede">
        URAI Studio packages are intentionally consultative until billing, Stripe products, checkout URLs, and webhook
        verification are configured. No fake checkout flow is presented.
      </p>

      <div className="grid feature-grid">
        {tiers.map((tier) => (
          <article className="card" key={tier.name}>
            <p className="eyebrow">{tier.name}</p>
            <h2>{tier.price}</h2>
            <p>{tier.description}</p>
            <ul>
              {tier.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Link className="button button-primary" href={hasStripe ? '/settings' : '/contact'}>
              {hasStripe ? 'Manage Billing' : 'Start Conversation'}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}