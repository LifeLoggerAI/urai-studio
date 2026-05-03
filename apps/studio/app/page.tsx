import Link from 'next/link';import { studioModules } from '@/lib/studio/modules';
export default function Home(){return <div><h1>URAI Studio</h1><p>Creative operating system for URAI</p>{studioModules.map(m=><div key={m.id} className='card'><Link href={m.route}>{m.name}</Link> · {m.status}</div>)}</div>}
