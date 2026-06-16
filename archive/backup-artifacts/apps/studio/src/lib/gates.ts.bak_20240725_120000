export type StudioRole = "founder" | "operator" | "viewer";

export const ROLE_ORDER: Record<StudioRole, number> = {
  viewer: 1,
  operator: 2,
  founder: 3
};

export function minRole(required: StudioRole, actual?: string | null) {
  const a = (actual || "viewer") as StudioRole;
  return (ROLE_ORDER[a] || 0) >= ROLE_ORDER[required];
}

// ---- Added for Studio v1 build stability (safe no-ops) ----
// These are referenced by API routes but may not exist yet in this repo.
// We will replace these with real plan gating + rate limiting during RBAC phase.

export async function enforcePlanIfEnabled(_uid: string, _requiredPlan: string) {
  // no-op in v1 shell
  return { ok: true };
}

export function rateLimit(_key: string, _opts?: { limit?: number; windowMs?: number }) {
  // no-op in v1 shell
  return { ok: true };
}
// ---- end no-ops ----
