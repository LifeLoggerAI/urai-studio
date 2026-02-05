import "server-only";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin";

export type Plan = "none" | "creator" | "pro";

export function planGatesEnabled() {
  return (process.env.URAI_PLAN_GATES || "off").toLowerCase() === "on";
}

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export function priceForPlan(plan: string): { priceId: string; tier: Plan } {
  const map: Record<string, { priceId?: string; tier: Plan }> = {
    creator_monthly: { priceId: process.env.STRIPE_PRICE_CREATOR_MONTHLY, tier: "creator" },
    creator_yearly: { priceId: process.env.STRIPE_PRICE_CREATOR_YEARLY, tier: "creator" },
    pro_monthly: { priceId: process.env.STRIPE_PRICE_PRO_MONTHLY, tier: "pro" },
    pro_yearly: { priceId: process.env.STRIPE_PRICE_PRO_YEARLY, tier: "pro" },
  };
  const hit = map[plan];
  if (!hit?.priceId) throw new Error("Unknown plan or missing STRIPE_PRICE_* env");
  return { priceId: hit.priceId, tier: hit.tier };
}

export async function setUserBilling(uid: string, patch: any) {
  const db = adminDb;
  await db.collection("users").doc(uid).set(
    {
      billing: {
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    },
    { merge: true }
  );
}

export async function getUserPlan(uid: string): Promise<{ active: boolean; tier: Plan }> {
  const db = adminDb;
  const snap = await db.collection("users").doc(uid).get();
  const billing = (snap.data() as any)?.billing || {};
  const status = String(billing.status || "inactive");
  const tier = (billing.tier as Plan) || "none";
  return { active: status === "active", tier };
}
