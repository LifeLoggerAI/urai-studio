import Link from 'next/link';
const links=['/','/studio','/dashboard','/system','/status','/assets','/asset-factory','/motion','/cinema','/music','/visuals','/content','/spatial','/admin','/jobs','/usage','/analytics','/integrations','/settings'];
export function StudioShell({children}:{children:React.ReactNode}){return <div className='shell'><aside className='nav'><h2>URAI Studio</h2><p>Creative operating system for URAI</p>{links.map(l=><Link key={l} href={l}>{l}</Link>)}</aside><main className='main'>{children}</main></div>}
