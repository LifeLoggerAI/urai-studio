export const dynamic = "force-dynamic";

export default function WaitlistPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const from = searchParams?.from || "/";
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>URAI Studio</h1>
      <p>Access opens in waves. Join the waitlist.</p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const email = String(fd.get("email") || "").trim();
          await fetch("/api/waitlist", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email, source: "waitlist_page" }),
          });
          (e.currentTarget as HTMLFormElement).reset();
          alert("Added. Watch your inbox.");
        }}
        style={{ display: "flex", gap: 12, marginTop: 16 }}
      >
        <input
          name="email"
          placeholder="you@email.com"
          type="email"
          required
          style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #333" }}
        />
        <button type="submit" style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #333" }}>
          Join
        </button>
      </form>

      <div style={{ marginTop: 22, opacity: 0.85 }}>
        <p>Have access already?</p>
        <a href={`/login?from=${encodeURIComponent(from)}`}>Sign in</a>
      </div>

      <p style={{ marginTop: 28 }}>
        <a href="/pricing">Pricing</a>
      </p>
    </main>
  );
}
