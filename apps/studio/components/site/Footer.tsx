import Link from 'next/link';
export function Footer(){return <footer className='footer'><div>© {new Date().getFullYear()} URAI Labs LLC</div><nav>{['/studio','/motion','/cinema','/music','/visuals','/spatial','/privacy','/contact','/status'].map(h=><Link key={h} href={h}>{h.replace('/','')||'home'}</Link>)}</nav></footer>}
