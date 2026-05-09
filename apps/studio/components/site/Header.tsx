import Link from 'next/link';

const nav = [
  { label: 'Studio', href: '/studio' },
  { label: 'Systems', href: '/systems' },
  { label: 'Generate', href: '/generate' },
  { label: 'Assets', href: '/assets' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Status', href: '/status' },
  { label: 'Contact', href: '/contact' },
];

export function Header() {
  return (
    <header className="header" role="banner">
      <Link href="#main-content" className="skip-link">
        Skip to content
      </Link>

      <Link href="/" className="logo" aria-label="URAI Studio home">
        <span className="logo-mark" aria-hidden="true" />
        URAI Studio
      </Link>

      <nav aria-label="Primary navigation">
        {nav.map(({ label, href }) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}

        <Link className="nav-cta header-cta" href="/contact">
          Start a Project
        </Link>
      </nav>
    </header>
  );
}