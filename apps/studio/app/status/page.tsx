async function fetchHealth() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/system/health`, { cache: 'no-store' });
    if (!res.ok) return { ok: false, error: `health_http_${res.status}` };
    return await res.json();
  } catch {
    return { ok: false, error: 'health_unavailable_in_current_runtime' };
  }
}

export default async function StatusPage() {
  const health = await fetchHealth();
  return (
    <section>
      <h1>System Status</h1>
      <p>Contract-driven diagnostics for URAI Studio integrations and fallback posture.</p>
      <pre className="card">{JSON.stringify(health, null, 2)}</pre>
    </section>
  );
}
