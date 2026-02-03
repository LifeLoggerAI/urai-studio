export const dynamic = "force-dynamic";

export default function PricingPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Pricing</h1>
      <p>Plans are handled via Stripe. If plan gates are enabled, you need an active plan to use Studio.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 20 }}>
        <div style={{ border: "1px solid #333", borderRadius: 14, padding: 16 }}>
          <h2>Creator</h2>
          <p>Core clip generation.</p>
          <form action="/api/billing/checkout" method="POST">
            <input type="hidden" name="plan" value="creator_monthly" />
            <button style={{ padding: 10, borderRadius: 10, border: "1px solid #333" }}>Start Creator (Monthly)</button>
          </form>
        </div>

        <div style={{ border: "1px solid #333", borderRadius: 14, padding: 16 }}>
          <h2>Pro</h2>
          <p>More jobs + priority queue.</p>
          <form action="/api/billing/checkout" method="POST">
            <input type="hidden" name="plan" value="pro_monthly" />
            <button style={{ padding: 10, borderRadius: 10, border: "1px solid #333" }}>Start Pro (Monthly)</button>
          </form>
        </div>
      </div>

      <p style={{ marginTop: 26 }}>
        <a href="/waitlist">Waitlist</a> · <a href="/login">Sign in</a>
      </p>
    </main>
  );
}
