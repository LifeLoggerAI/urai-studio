import Link from 'next/link';
import type { ReactNode } from 'react';

const groups = [
  {
    title: 'Command',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Studio', href: '/studio' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    title: 'Creative systems',
    links: [
      { label: 'Systems', href: '/systems' },
      { label: 'Generate', href: '/generate' },
      { label: 'Assets', href: '/assets' },
      { label: 'Asset Factory', href: '/asset-factory' },
      { label: 'Motion', href: '/motion' },
      { label: 'Cinema', href: '/cinema' },
      { label: 'Music', href: '/music' },
      { label: 'Visuals', href: '/visuals' },
      { label: 'Content', href: '/content' },
      { label: 'Spatial', href: '/spatial' },
    ],
  },
  {
    title: 'Operations',
    links: [
      { label: 'Admin', href: '/admin' },
      { label: 'Jobs', href: '/jobs' },
      { label: 'Usage', href: '/usage' },
      { label: 'Analytics', href: '/analytics' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Settings', href: '/settings' },
    ],
  },
];

export function StudioShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell studio-shell-v2">
      <aside className="nav studio-rail-v2" aria-label="Studio module navigation">
        <Link className="rail-brand-v2" href="/">
          <span className="logo-mark" aria-hidden="true" />
          <span>
            <strong>URAI Studio</strong>
            <small>Cinematic operating system</small>
          </span>
        </Link>

        <div className="rail-status-v2">
          <span className="status-pulse-v2" aria-hidden="true" />
          <span>Live studio spine</span>
        </div>

        {groups.map((group) => (
          <nav key={group.title} className="rail-group-v2" aria-label={group.title}>
            <p>{group.title}</p>
            {group.links.map(({ label, href }) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
        ))}
      </aside>
      <div className="main studio-main-v2">{children}</div>
    </div>
  );
}
