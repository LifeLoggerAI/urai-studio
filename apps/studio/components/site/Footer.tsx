import Link from 'next/link';

const footerLinks = [
  { label: 'Studio', href: '/studio' },
  { label: 'Motion', href: '/motion' },
  { label: 'Cinema', href: '/cinema' },
  { label: 'Music', href: '/music' },
  { label: 'Visuals', href: '/visuals' },
  { label: 'Spatial', href: '/spatial' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Contact', href: '/contact' },
  { label: 'Status', href: '/status' },
];

const CURRENT_YEAR = 2026;

export function Footer() {
  return (
    <footer className="footer">
      <div>
        © {CURRENT_YEAR} URAI Labs LLC · Cinematic AI systems, production infrastructure,
        and intelligent storytelling interfaces.
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
