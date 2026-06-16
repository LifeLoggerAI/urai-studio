import "tailwindcss/tailwind.css";
import { Inter, Roboto_Mono } from 'next/font/google';
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const roboto_mono = Roboto_Mono({ subsets: ['latin'], variable: '--font-roboto-mono' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto_mono.variable}`}>
      <body>
        <AuthProvider>
          <div className="flex flex-col h-screen">
            <header className="bg-gray-800 text-white p-4">
              <h1 className="text-xl">URAI Studio</h1>
            </header>
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
