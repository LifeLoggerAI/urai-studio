import Link from 'next/link';

const links = [
  { label: 'Home', href: '/' },
  { label: 'Studio', href: '/studio' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'System', href: '/system' },
  { label: 'Status', href: '/status' },
  { label: 'Assets', href: '/assets' },
  { label: 'Asset Factory', href: '/asset-factory' },
  { label: 'Motion', href: '/motion' },
  { label: 'Cinema', href: '/cinema' },
  { label: 'Music', href: '/music' },
  { label: 'Visuals', href: '/visuals' },
  { label: 'Content', href: '/content' },
  { label: 'Spatial', href: '/spatial' },
  { label: 'Admin', href: '/admin' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Usage', href: '/usage' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Settings', href: '/settings' },
];

export function StudioShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="nav" aria-label="Studio module navigation">
        <h2>URAI Studio</h2>
        <p>Creative operating system for URAI</p>
        {links.map(({ label, href }) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
