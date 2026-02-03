import Link from "next/link";

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-neutral-600">{desc}</div>
    </Link>
  );
}

export default function StudioHome() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-4xl font-extrabold tracking-tight">Overview</div>
        <div className="mt-2 max-w-2xl text-sm text-neutral-600">
          This is the Studio shell. Next: wire Jobs/Renders/Clips to Firestore + add “Replay” and “Dead Letter” flows.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card title="Jobs" desc="Queue health + retry controls" href="/studio/jobs" />
        <Card title="Clips" desc="Drafts + versions" href="/studio/clips" />
        <Card title="Renders" desc="Runs + artifacts" href="/studio/renders" />
        <Card title="Dead Letter" desc="Failures + replay" href="/studio/dead-letter" />
      </div>
    </div>
  );
}
