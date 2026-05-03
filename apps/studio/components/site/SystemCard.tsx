import Link from 'next/link'; import { StatusBadge } from './StatusBadge'; import { SystemDef } from '@/lib/studio/systems';
export function SystemCard({s}:{s:SystemDef}){return <article className='card'><div><h3>{s.name}</h3><StatusBadge status={s.status}/></div><p>{s.description}</p><Link href={s.route}>{s.cta}</Link></article>}
