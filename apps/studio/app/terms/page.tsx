export default function TermsPage() {
  return (
    <section className="prose-page" data-urai-studio-page="terms">
      <p className="eyebrow">Legal</p>
      <h1>URAI Studio Terms of Service</h1>

      <p>
        These launch terms apply to the public URAI Studio website at www.uraistudio.com. They are intended to
        support waitlist, project inquiry, preview, and demonstration use before broader commercial availability.
        These terms are a production-ready operating placeholder and should be reviewed by counsel before
        high-volume commercial rollout.
      </p>

      <div className="grid feature-grid">
        <article className="card">
          <h2>Use of the website</h2>
          <p>
            You may use the website to learn about URAI Studio, join the waitlist, request contact, and review
            public product materials. Do not misuse the website, interfere with its operation, attempt unauthorized
            access, submit malicious content, or use forms for spam or abuse.
          </p>
        </article>

        <article className="card">
          <h2>Preview status</h2>
          <p>
            URAI Studio features, demos, pricing, integrations, generated-media workflows, dashboards, and
            availability may change before public release. Public pages should not be treated as a guaranteed
            service commitment unless separately agreed in writing.
          </p>
        </article>

        <article className="card">
          <h2>Submitted information</h2>
          <p>
            You are responsible for the accuracy and legality of information you submit. Do not submit confidential,
            regulated, or sensitive production data through public preview forms unless URAI Labs has explicitly
            approved that workflow.
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
          <h2>Intellectual property</h2>
          <p>
            The URAI Studio website, branding, designs, copy, code, and product materials are owned by URAI Labs LLC
            or its licensors. These terms do not grant rights to copy, redistribute, or reverse engineer the service.
          </p>
        </article>

        <article className="card">
          <h2>Availability</h2>
          <p>
            System health endpoints describe current service posture without guaranteeing uninterrupted availability.
            Production SLAs, if any, should be documented in a separate written agreement.
          </p>
        </article>

        <article className="card">
          <h2>Disclaimers</h2>
          <p>
            The website is provided as-is during launch preparation. URAI Labs disclaims warranties to the maximum
            extent permitted by law and does not guarantee uninterrupted or error-free operation.
          </p>
        </article>
      </div>

      <h2>Contact</h2>
      <p>Questions about these terms can be sent through the public contact page.</p>

      <p>
        <strong>Effective date:</strong> May 8, 2026
      </p>
    </section>
  );
}