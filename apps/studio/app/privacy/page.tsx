export default function PrivacyPage() {
  return (
    <section className="stack">
      <p className="eyebrow">URAI Labs LLC</p>
      <h1>Privacy Policy</h1>
      <p>
        URAI Studio is built to help teams create, manage, and operate AI-assisted production systems. This policy
        explains the privacy baseline for the public Studio site and early access intake flows.
      </p>

      <div className="card stack">
        <h2>Information we collect</h2>
        <p>
          We collect information you intentionally submit, such as your email address, contact message, waitlist
          request, and related business context. Operational logs may also include technical metadata such as browser,
          device, request time, and approximate network information.
        </p>
      </div>

      <div className="card stack">
        <h2>How we use information</h2>
        <p>
          We use submitted information to respond to inquiries, manage early access, improve Studio reliability, secure
          the platform, and understand which URAI systems are most useful to prospective users.
        </p>
      </div>

      <div className="card stack">
        <h2>AI and production data</h2>
        <p>
          Do not submit confidential production assets, regulated data, or sensitive personal information through public
          forms. Production integrations should use approved workspaces, access controls, and project-specific data
          processing terms before handling sensitive material.
        </p>
      </div>

      <div className="card stack">
        <h2>Sharing and retention</h2>
        <p>
          We do not sell personal information. We may share limited information with service providers that help operate
          the site, secure infrastructure, or respond to your request. We retain information only as long as needed for
          business, legal, security, or operational purposes.
        </p>
      </div>

      <div className="card stack">
        <h2>Your choices</h2>
        <p>
          To request access, correction, or deletion of information you submitted, contact URAI Labs through the public
          contact form. We may need to verify your request before acting on it.
        </p>
      </div>

      <p>
        Last updated: May 7, 2026. This page is a product-readiness baseline and should be reviewed by counsel before a
        broad public launch.
      </p>
    </section>
  );
}
