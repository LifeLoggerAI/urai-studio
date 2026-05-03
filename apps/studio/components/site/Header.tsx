import Link from 'next/link';
const nav=[['Studio','/studio'],['Systems','/systems'],['Motion','/motion'],['Cinema','/cinema'],['Spatial','/spatial'],['Privacy','/privacy'],['Demo','/demo'],['Waitlist','/waitlist'],['Contact','/contact']];
export function Header(){return <header className='header'><Link href='/' className='logo'>URAI Studio</Link><nav>{nav.map(([l,h])=><Link key={h} href={h}>{l}</Link>)}</nav></header>}
