import './globals.css';
import { StudioShell } from '@/components/studio/StudioShell';
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang='en'><body><StudioShell>{children}</StudioShell></body></html>}
