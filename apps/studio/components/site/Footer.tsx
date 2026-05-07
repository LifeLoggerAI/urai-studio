import Link from 'next/link';

import { siteMeta } from '@/lib/studio/site';

const footerLinks = [
  ['Studio', '/studio'],
  ['Systems', '/systems'],
  ['Motion', '/motion'],
  ['Cinema', '/cinema'],
  ['Music', '/music'],
  ['Visuals', '/visuals'],
  ['Spatial', '/spatial'],
  ['Privacy', '/privacy'],
  ['Status', '/status'],
  ['Contact', '/contact'],
];

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <strong>URAI Studio</strong>
        <p>Premium cinematic AI systems from URAI Labs LLC.</p>
        <a href={`mailto:${siteMeta.contactEmail}`}>{siteMeta.contactEmail}</a>
      </div>
      <nav aria-label="Footer navigation">
        {footerLinks.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <small>© {new Date().getFullYear()} URAI Labs LLC. All rights reserved.</small>
    </footer>
  );
}
