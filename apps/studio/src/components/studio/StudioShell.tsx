
export function StudioShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-7xl">
        <main className="flex-1">
          <div className="px-4 py-6 md:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
