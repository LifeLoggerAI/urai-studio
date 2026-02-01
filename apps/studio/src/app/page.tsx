import { Button } from '@urai/ui';

export default function Page() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-6xl font-bold">
        Welcome to <a href="https://nextjs.org">URAI Studio</a>
      </h1>

      <p className="mt-3 text-2xl">
        Get started by signing in.
      </p>

      <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
        <Button>Sign In</Button>
      </div>
    </main>
  );
}
