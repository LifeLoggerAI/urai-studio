import Link from 'next/link';

const nav = [
  { label: 'Studio', href: '/studio' },
  { label: 'Generate', href: '/generate' },
  { label: 'Assets', href: '/assets' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Status', href: '/status' },
  { label: 'System', href: '/system' },
];

export function Header() {
  return (
    <header className="header">
      <Link href="/" className="logo" aria-label="URAI Studio home">
        URAI Studio
      </Link>

      <nav aria-label="Primary navigation">
        {nav.map(({ label, href }) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
        <Link className="header-cta" href="/contact">
          Start a Project
        </Link>
      </nav>
    </header>
  );
}
