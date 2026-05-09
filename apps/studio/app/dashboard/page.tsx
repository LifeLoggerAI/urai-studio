import type { Metadata } from 'next';

import { SystemCard } from '@/components/site/SystemCard';
import { systems } from '@/lib/studio/systems';

export const metadata: Metadata = {
  title: 'Studio Dashboard',
  description: 'URAI Studio dashboard for system health overview, module quick actions, and system-of-systems navigation.',
  alternates: {
    canonical: '/dashboard',
  },
};

export default function Page() {
  return (
    <section data-urai-studio-page="dashboard" className="page-stack">
      <p className="eyebrow">Studio dashboard</p>
      <h1>Studio Dashboard</h1>
      <p className="hero-lede">System health overview, module quick actions, and system-of-systems navigation.</p>

      <div className="grid">
        {systems.map((system) => (
          <SystemCard key={system.id} s={system} />
        ))}
      </div>
    </section>
  );
}
