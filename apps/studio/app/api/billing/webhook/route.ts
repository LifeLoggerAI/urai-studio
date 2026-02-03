import { NextRequest, NextResponse } from "next/server";
import { stripe, setUserBilling } from "@/lib/billing";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function tierFromPriceId(priceId: string): "creator" | "pro" | "none" {
  const creator = new Set([process.env.STRIPE_PRICE_CREATOR_MONTHLY, process.env.STRIPE_PRICE_CREATOR_YEARLY].filter(Boolean) as string[]);
  const pro = new Set([process.env.STRIPE_PRICE_PRO_MONTHLY, process.env.STRIPE_PRICE_PRO_YEARLY].filter(Boolean) as string[]);
  if (pro.has(priceId)) return "pro";
  if (creator.has(priceId)) return "creator";
  return "none";
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secret) return NextResponse.json({ ok: false, error: "missing_STRIPE_WEBHOOK_SECRET" }, { status: 500 });

  const sig = req.headers.get("stripe-signature") || "";
  if (!sig) return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });

  const raw = await req.text();
  const s = stripe();

  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(raw, sig, secret);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "bad_signature", message: e?.message || "" }, { status: 400 });
  }

  // We store subscription state on users/{uid}.billing
  // uid is provided via customer metadata or checkout.session metadata
  const write = async (uid: string, patch: any) => setUserBilling(uid, patch);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sess = event.data.object as Stripe.Checkout.Session;
        const uid = (sess.metadata?.uid || "") as string;
        const tier = (sess.metadata?.tier || "none") as string;
        if (uid) await write(uid, { status: "active", tier, stripeCustomerId: String(sess.customer || "") });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = String(sub.customer || "");
        const status = String(sub.status || "inactive");

        // pull uid from customer metadata
        const cust = await s.customers.retrieve(customerId);
        const uid = (cust as any)?.metadata?.uid || "";

        const priceId = String(sub.items?.data?.[0]?.price?.id || "");
        const tier = tierFromPriceId(priceId);

        const normalized =
          status === "active" || status === "trialing" ? "active" :
          status === "past_due" ? "past_due" :
          "inactive";

        if (uid) await write(uid, { status: normalized, tier, stripeCustomerId: customerId, stripeSubscriptionId: sub.id });
        break;
      }

      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = String(inv.customer || "");
        const cust = await s.customers.retrieve(customerId);
        const uid = (cust as any)?.metadata?.uid || "";
        if (uid) await write(uid, { status: "past_due" });
        break;
      }

      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = String(inv.customer || "");
        const cust = await s.customers.retrieve(customerId);
        const uid = (cust as any)?.metadata?.uid || "";
        if (uid) await write(uid, { status: "active" });
        break;
      }

      default:
        break;
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "webhook_handler_failed", message: e?.message || "" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
