export default function TermsPage() {
  return (
    <section data-urai-studio-page="terms">
      <p className="eyebrow">Terms</p>
      <h1>URAI Studio Terms</h1>
      <p>
        These terms are a production-ready operating placeholder for URAI Studio and should be reviewed
        by counsel before high-volume commercial rollout. They are written to avoid unsupported legal claims.
      </p>

      <div className="grid feature-grid">
        <article className="card">
          <h2>Use of the service</h2>
          <p>
            URAI Studio provides creative systems, generated-media workflows, dashboards, and related
            professional services. Users are responsible for providing lawful, authorized materials and instructions.
          </p>
        </article>
        <article className="card">
          <h2>Generated content</h2>
          <p>
            Generated outputs may depend on prompts, source materials, third-party services, and configured
            production pipelines. Enterprise agreements may define ownership, review, and usage rights in more detail.
          </p>
        </article>
        <article className="card">
          <h2>Accounts and access</h2>
          <p>
            Protected dashboards, assets, and job workflows may require authenticated access. Credentials,
            API keys, and private links should be kept secure and shared only with authorized collaborators.
          </p>
        </article>
        <article className="card">
          <h2>Availability</h2>
          <p>
            System health endpoints describe current service posture without guaranteeing uninterrupted availability.
            Production SLAs, if any, should be documented in a separate written agreement.
          </p>
        </article>
      </div>
    </section>
  );
}
