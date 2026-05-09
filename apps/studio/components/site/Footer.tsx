import Link from 'next/link';

import { siteMeta } from '@/lib/studio/site';

const footerLinks = [
  { label: 'Studio', href: '/studio' },
  { label: 'Systems', href: '/systems' },
  { label: 'Motion', href: '/motion' },
  { label: 'Cinema', href: '/cinema' },
  { label: 'Music', href: '/music' },
  { label: 'Visuals', href: '/visuals' },
  { label: 'Spatial', href: '/spatial' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
  { label: 'Status', href: '/status' },
];

const CURRENT_YEAR = 2026;

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <strong>URAI Studio</strong>
        <p>Premium cinematic AI systems from URAI Labs LLC.</p>
        <a href={`mailto:${siteMeta.contactEmail}`}>{siteMeta.contactEmail}</a>
        <p>
          © {CURRENT_YEAR} URAI Labs LLC. All rights reserved.
        </p>
      </div>

      <nav aria-label="Footer navigation">
        {footerLinks.map(({ label, href }) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}