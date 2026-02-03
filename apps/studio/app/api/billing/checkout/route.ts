import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/authServer";
import { priceForPlan, stripe, setUserBilling } from "@/lib/billing";

function parseFormUrlEncoded(t: string) {
  const out: Record<string, string> = {};
  for (const part of t.split("&")) {
    const [k, v] = part.split("=");
    out[decodeURIComponent(k)] = decodeURIComponent(v || "");
  }
  return out;
}

export async function POST(req: NextRequest) {
  const { uid, email } = await requireSession();

  const ct = req.headers.get("content-type") || "";
  const body = ct.includes("application/x-www-form-urlencoded") ? parseFormUrlEncoded(await req.text()) : await req.json().catch(() => ({}));
  const plan = String(body.plan || "").trim();

  const { priceId, tier } = priceForPlan(plan);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  if (!appUrl) return NextResponse.json({ ok: false, error: "missing_NEXT_PUBLIC_APP_URL" }, { status: 500 });

  // Create customer + session
  const s = stripe();
  const customer = await s.customers.create({
    email: email || undefined,
    metadata: { uid },
  });

  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/?billing=success`,
    cancel_url: `${appUrl}/pricing?billing=cancel`,
    metadata: { uid, tier },
  });

  // optimistic write
  await setUserBilling(uid, { status: "pending", tier, stripeCustomerId: customer.id });

  return NextResponse.redirect(session.url!, 303);
}
