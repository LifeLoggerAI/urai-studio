import Link from 'next/link';

import { HeroVisual } from '@/components/site/HeroVisual';
import { studioModules } from '@/lib/studio/modules';

export default function Home() {
  const quickLinks = [
    ['Join Waitlist', '/waitlist'],
    ['View Demo', '/demo'],
    ['Explore Systems', '/systems'],
    ['Contact', '/contact'],
  ];

  return (
    <section>
      <h1>Cinematic systems for memory, media, spatial storytelling, and intelligent life interfaces.</h1>
      <p>URAI Studio is private by design and built to move from signals to story.</p>

      <div className="hero-visual">
        <HeroVisual />
      </div>

      <div className="grid">
        {quickLinks.map(([label, href]) => (
          <Link className="card" key={href} href={href}>
            {label}
          </Link>
        ))}
      </div>

      <h2>Studio Modules</h2>

      <div className="grid">
        {studioModules.map((module) => (
          <div key={module.id} className="card">
            <Link href={module.route}>{module.name}</Link> · {module.status}
          </div>
        ))}
      </div>
    </section>
  );
}