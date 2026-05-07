import Link from 'next/link';

const nav = [
  { label: 'Studio', href: '/studio' },
  { label: 'Systems', href: '/systems' },
  { label: 'Motion', href: '/motion' },
  { label: 'Cinema', href: '/cinema' },
  { label: 'Spatial', href: '/spatial' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Demo', href: '/demo' },
  { label: 'Contact', href: '/contact' },
];

export function Header() {
  return (
    <header className="header">
      <Link href="#main-content" className="skip-link">
        Skip to content
      </Link>
      <Link href="/" className="logo" aria-label="URAI Studio home">
        URAI Studio
      </Link>

      <nav aria-label="Primary navigation">
        {nav.map(({ label, href }) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
        <Link className="header-cta" href="/waitlist">
          Join Waitlist
        </Link>
      </nav>
    </header>
  );
}
