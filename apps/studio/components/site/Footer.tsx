import Link from 'next/link';

const footerLinks = [
  { label: 'Studio', href: '/studio' },
  { label: 'Generate', href: '/generate' },
  { label: 'Assets', href: '/assets' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
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
