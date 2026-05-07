import Link from 'next/link';

const nav = [
  ['Studio', '/studio'],
  ['Systems', '/systems'],
  ['Motion', '/motion'],
  ['Cinema', '/cinema'],
  ['Spatial', '/spatial'],
  ['Privacy', '/privacy'],
  ['Demo', '/demo'],
  ['Contact', '/contact'],
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
        {nav.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
        <Link href="/waitlist" className="nav-cta">
          Join Waitlist
        </Link>
      </nav>
    </header>
  );
}
