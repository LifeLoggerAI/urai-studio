import { StudioShell } from "@/components/studio/StudioShell";

export default function SettingsPage() {
  return (
    <StudioShell title="Settings" subtitle="RBAC + Plan gates (wired next)">
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/20 p-5">
        <div className="text-sm font-semibold">Access</div>
        <div className="mt-2 text-xs text-zinc-400">
          Next: founder/operator/viewer roles enforced in Node runtime route handlers.
        </div>
      </div>
    </StudioShell>
  );
}
