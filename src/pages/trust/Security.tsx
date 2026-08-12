import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function Security() {
  return (
    <LegalPageLayout
      title="Security | CONTRIVER"
      description="Our security program, infrastructure, certifications, and how to report vulnerabilities."
      canonical="/security"
      heading="Security at CONTRIVER"
      eyebrow="Trust"
    >
      <p>
        Security is a first-class engineering discipline at CONTRIVER. We
        protect your data with the same rigor we'd apply to our own.
      </p>

      <h2>Infrastructure</h2>
      <p>
        Our production stack runs on enterprise-grade cloud infrastructure
        with regional isolation, automated backups, and disaster-recovery
        procedures tested regularly.
      </p>

      <h2>Application security</h2>
      <ul>
        <li>Row-Level Security enforced at the database layer.</li>
        <li>Mandatory code review and automated dependency scanning.</li>
        <li>Continuous monitoring for anomalous behavior and abuse.</li>
        <li>Regular third-party penetration testing.</li>
      </ul>

      <h2>Identity & access</h2>
      <ul>
        <li>Argon2 password hashing and rate-limited auth endpoints.</li>
        <li>Optional two-factor authentication for all accounts.</li>
        <li>SSO and SCIM for Enterprise customers.</li>
      </ul>

      <h2>Report a vulnerability</h2>
      <p>
        Found a security issue? Please report it responsibly to
        <a href="mailto:security@contriver.app"> security@contriver.app</a>.
        We acknowledge reports within 48 hours and credit researchers in our
        hall of fame.
      </p>
    </LegalPageLayout>
  );
}