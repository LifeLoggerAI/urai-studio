import './globals.css';

import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { StudioShell } from '@/components/studio/StudioShell';
import { siteMeta } from '@/lib/studio/site';

export const metadata = {
  title: {
    default: siteMeta.title,
    template: '%s | URAI Studio',
  },
  description: siteMeta.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <StudioShell>
          <main className="container">{children}</main>
        </StudioShell>
        <Footer />
      </body>
    </html>
  );
}