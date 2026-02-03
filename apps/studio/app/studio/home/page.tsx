
import React from "react";

type ActivityItem = {
  id: string;
  state: "SUCCESS" | "RUNNING" | "RETRYING" | "FAILED";
  title: string;
  subtitle: string;
  time: string;
  actionLabel?: string;
};

const statusDot = (online: boolean) => (
  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
    <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-zinc-400"}`} />
    {online ? "Studio online" : "Studio offline"}
  </span>
);

const badge = (state: ActivityItem["state"]) => {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
  if (state === "SUCCESS") return <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>Clip created</span>;
  if (state === "RUNNING") return <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>Making a clip</span>;
  if (state === "RETRYING") return <span className={`${base} border-sky-200 bg-sky-50 text-sky-700`}>Retrying</span>;
  return <span className={`${base} border-rose-200 bg-rose-50 text-rose-700`}>Needs attention</span>;
};

export default function StudioFriendHomeMock() {
  const online = true;

  const activity: ActivityItem[] = [
    { id: "a1", state: "SUCCESS", title: "Clip generated", subtitle: "Call: Mike • Highlight: “the turning point”", time: "3 min ago", actionLabel: "Open" },
    { id: "a2", state: "RUNNING", title: "Rendering short", subtitle: "Vertical 9:16 • Captions on", time: "now", actionLabel: "Details" },
    { id: "a3", state: "RETRYING", title: "Retrying upload", subtitle: "TikTok draft • Safe replay", time: "12 min ago", actionLabel: "Details" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-500/20 via-fuchsia-500/10 to-transparent blur-3xl" />
        <div className="absolute bottom-[-25%] left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-t from-emerald-500/10 via-sky-500/5 to-transparent blur-3xl" />
      </div>

      {/* Frame */}
      <div className="relative mx-auto max-w-[980px] px-6 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <div className="text-lg font-semibold tracking-tight">URAI Studio</div>
            <div className="text-xs text-zinc-400">Your clips are made here.</div>
          </div>
          <div className="flex items-center gap-3">
            {statusDot(online)}
            <div className="text-xs text-zinc-400">Last run: 14 minutes ago</div>
          </div>
        </div>

        {/* Hero */}
        <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
          <div className="max-w-[640px]">
            <div className="text-3xl font-semibold leading-tight tracking-tight">
              Create clips from real moments.
            </div>
            <div className="mt-3 text-sm text-zinc-300">
              URAI finds highlights and turns them into ready-to-post shorts.
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow hover:opacity-95 active:opacity-90"
              >
                Make clips automatically
              </button>

              <a
                className="text-sm text-zinc-300 hover:text-white underline underline-offset-4"
                href="/studio/jobs"
              >
                Advanced controls →
              </a>
            </div>
          </div>
        </div>

        {/* What’s happening */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-[1fr_360px]">
          {/* Activity list */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">What’s happening</div>
              <div className="text-xs text-zinc-500">Live activity</div>
            </div>

            <div className="mt-4 space-y-3">
              {activity.map((it) => (
                <div key={it.id} className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      {badge(it.state)}
                      <div className="truncate text-sm font-medium">{it.title}</div>
                      <div className="ml-auto shrink-0 text-xs text-zinc-500">{it.time}</div>
                    </div>
                    <div className="mt-1 truncate text-xs text-zinc-400">{it.subtitle}</div>
                  </div>

                  {it.actionLabel ? (
                    <button className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900">
                      {it.actionLabel}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Right rail: “Ready clips” teaser */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-6">
            <div className="text-sm font-semibold">Ready clips</div>
            <div className="mt-1 text-xs text-zinc-400">Drafts created automatically.</div>

            <div className="mt-5 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                  <div className="text-sm font-medium">Draft clip #{n}</div>
                  <div className="mt-1 text-xs text-zinc-400">Vertical • Captions • 0:34</div>
                  <div className="mt-4 flex gap-2">
                    <button className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-950">Post</button>
                    <button className="rounded-xl border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200">Edit</button>
                    <button className="rounded-xl border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200">Skip</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-[11px] text-zinc-500">
              Tip: You don’t have to “create” anything. URAI creates drafts in the background.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center justify-between text-xs text-zinc-500">
          <div>URAI Studio • v1</div>
          <div className="flex gap-4">
            <a className="hover:text-zinc-200" href="/studio/jobs">Jobs</a>
            <a className="hover:text-zinc-200" href="/studio/dlq">Dead letter</a>
            <a className="hover:text-zinc-200" href="/studio/settings">Settings</a>
          </div>
        </div>
      </div>
    </div>
  );
}
