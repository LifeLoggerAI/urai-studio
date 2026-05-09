import type { Metadata } from 'next';
import Link from 'next/link';

import { StudioActionPanel } from '@/components/studio/StudioActionPanel';

export const metadata: Metadata = {
  title: 'Studio XR',
  description: 'URAI Studio XR readiness surface for spatial previews, VR manifests, comfort settings, and cinematic scene export contracts.',
  alternates: { canonical: '/studio/xr' },
};

const xrContracts = [
  {
    title: 'Life Planetarium',
    body: 'Studio projects can be represented as spatial constellations once XR renderers consume project, scene, asset, and scroll records.',
  },
  {
    title: 'Companion Chamber',
    body: 'Narrator scripts and companion intros are stored as callable-generated records that can be voiced or embodied later.',
  },
  {
    title: 'Comfort settings',
    body: 'XR sessions should preserve comfort-first navigation, reduced-motion defaults, and clear exits.',
  },
  {
    title: 'Export bridge',
    body: 'Export manifests include scene and asset references suitable for downstream spatial packaging.',
  },
];

export default function StudioXrPage() {
  return (
    <section data-urai-studio-page="studio-xr" className="page-stack">
      <p className="eyebrow">Spatial Studio</p>
      <h1>XR readiness</h1>
      <p className="hero-lede">
        A contract surface for turning URAI Studio projects, scenes, assets, narration, and scroll exports into spatial and VR-ready experiences.
      </p>

      <div className="grid">
        {xrContracts.map((contract) => (
          <article className="card" key={contract.title}>
            <p className="eyebrow">XR contract</p>
            <h2>{contract.title}</h2>
            <p>{contract.body}</p>
          </article>
        ))}
      </div>

      <StudioActionPanel />

      <div className="cta-row">
        <Link className="button button-secondary" href="/studio/projects">Open projects</Link>
        <Link className="button button-secondary" href="/studio/exports">Open exports</Link>
        <Link className="button button-secondary" href="/spatial">Open spatial module</Link>
      </div>
    </section>
  );
}
