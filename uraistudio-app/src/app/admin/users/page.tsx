import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Users() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}>
      <h1 className="text-4xl font-bold">Users</h1>
    </main>
  );
}
