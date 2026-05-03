async function fetchJson(path: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}${path}`, { cache: 'no-store' });
    if (!res.ok) return { ok: false, error: `${path}_http_${res.status}` };
    return await res.json();
  } catch {
    return { ok: false, error: `${path}_unavailable_in_current_runtime` };
  }
}

export default async function StatusPage() {
  const [systemHealth, apiHealth, healthz] = await Promise.all([
    fetchJson('/api/system/health'),
    fetchJson('/api/health'),
    fetchJson('/healthz'),
  ]);

  return (
    <section>
      <h1>System Status</h1>
      <p>Contract-driven diagnostics snapshots for system, API, and platform health.</p>
      <div className="grid">
        <div className="card"><h3>/api/system/health</h3><pre>{JSON.stringify(systemHealth, null, 2)}</pre></div>
        <div className="card"><h3>/api/health</h3><pre>{JSON.stringify(apiHealth, null, 2)}</pre></div>
        <div className="card"><h3>/healthz</h3><pre>{JSON.stringify(healthz, null, 2)}</pre></div>
      </div>
    </section>
  );
}
