import Link from 'next/link';

const footerLinks = [
  { label: 'Studio', href: '/studio' },
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

export function Footer() {
  return (
    <footer className="footer">
      <div>© {new Date().getFullYear()} URAI Labs LLC</div>
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
