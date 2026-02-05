import { StudioShell } from "@/components/studio/StudioShell";

export default function ReplayPage() {
  return (
    <StudioShell>
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/20 p-5">
        <div className="text-sm font-semibold">Replay</div>
        <div className="mt-2 text-xs text-zinc-400">
          Next: replay by jobId/runId with idempotency key + safety rules.
        </div>
      </div>
    </StudioShell>
  );
}
