"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/studio", label: "Overview", icon: "🏠" },
  { href: "/studio/jobs", label: "Jobs", icon: "🧾" },
  { href: "/studio/clips", label: "Clips", icon: "🎞️" },
  { href: "/studio/renders", label: "Renders", icon: "🖥️" },
  { href: "/studio/dead-letter", label: "Dead Letter", icon: "📮" },
  { href: "/studio/settings", label: "Settings", icon: "⚙️" }
];

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-[260px_1fr] gap-0">
          <aside className="sticky top-0 h-screen border-r border-neutral-200 bg-neutral-50">
            <div className="px-5 pt-6 pb-4">
              <div className="text-2xl font-extrabold tracking-tight">URAI Studio</div>
              <div className="mt-1 text-xs text-neutral-500">ops console • v1</div>
            </div>

            <nav className="px-3">
              <ul className="space-y-1">
                {NAV.map((n) => {
                  const active = path === n.href || (n.href !== "/studio" && path?.startsWith(n.href));
                  return (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        className={clsx(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                          active
                            ? "bg-white shadow-sm ring-1 ring-neutral-200"
                            : "text-neutral-700 hover:bg-white hover:ring-1 hover:ring-neutral-200"
                        )}
                      >
                        <span className="w-5">{n.icon}</span>
                        <span>{n.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="px-5 pt-6 text-xs text-neutral-500">
              <div>env: dev</div>
              <div>project: urai-studio</div>
            </div>
          </aside>

          <main className="min-h-screen">
            <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
              <div className="flex items-center justify-between px-8 py-4">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <span className="font-semibold text-neutral-900">Studio</span>
                  <span className="text-neutral-400">•</span>
                  <span>Queue</span>
                  <span className="text-neutral-400">•</span>
                  <span>Render</span>
                  <span className="text-neutral-400">•</span>
                  <span>Audit</span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <Link className="text-blue-600 hover:underline" href="/api/health">
                    health
                  </Link>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold">
                    A
                  </div>
                </div>
              </div>
            </header>

            <div className="px-8 py-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
