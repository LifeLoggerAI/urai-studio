import { systems } from '@/lib/studio/systems'; import { SystemCard } from '@/components/site/SystemCard';
export default function Page(){return <section><h1>URAI System of Systems</h1><p>Each module connects through shared contracts, status, and privacy-first controls.</p><div className='grid'>{systems.map(s=><SystemCard key={s.id} s={s}/>)}</div></section>}
