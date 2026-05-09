import type { Metadata } from 'next';

import { WaitlistForm } from './WaitlistForm';

export const metadata: Metadata = {
  title: 'Waitlist',
  description: 'Join the URAI Studio waitlist for cinematic AI production systems, spatial demos, and creator-facing tools.',
  alternates: {
    canonical: '/waitlist',
  },
};

export default function WaitlistPage() {
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

      <WaitlistForm />
    </section>
  );
}
