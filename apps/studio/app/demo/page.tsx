import type { Metadata } from 'next';

import { council, demoLifeMap, demoWeeklyScroll } from '@/lib/studio/demo-data';

export const metadata: Metadata = {
  title: 'Demo',
  description: 'URAI Studio seeded demo for weekly scrolls, life map previews, and Council narrative systems.',
  alternates: {
    canonical: '/demo',
  },
};

export default function Page() {
  return (
    <section data-urai-studio-page="demo" className="page-stack">
      <p className="eyebrow">Seeded demo</p>
      <h1>URAI Demo</h1>
      <p className="hero-lede">Council autonomy is OFF by default. This is a seeded demo story.</p>
      <div className="card">
        <h3>{demoWeeklyScroll.title}</h3>
        <p>{demoWeeklyScroll.summary}</p>
        <ul>
          {demoWeeklyScroll.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h3>Life Map Preview</h3>
        <ul>
          {demoLifeMap.map((event) => (
            <li key={event.day}>
              {event.day}: {event.event}
            </li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h3>Council</h3>
        {council.join(', ')}
      </div>
    </section>
  );
}
