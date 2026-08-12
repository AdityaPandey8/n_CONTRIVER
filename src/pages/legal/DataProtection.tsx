import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function DataProtection() {
  return (
    <LegalPageLayout
      title="Data Protection | CONTRIVER"
      description="Our security practices, encryption standards, access controls, and breach response procedures."
      canonical="/data-protection"
      heading="Data Protection"
      eyebrow="Legal"
      lastUpdated="May 30, 2026"
    >
      <p>
        Protecting your data is foundational to CONTRIVER. This page describes
        the technical and organizational measures we apply to keep customer
        and user data safe.
      </p>

      <h2>1. Security Measures</h2>
      <p>
        We operate a defense-in-depth security program covering network,
        application, data, and operational layers. Production systems are
        hardened, monitored continuously, and reviewed regularly through
        internal audits and third-party assessments.
      </p>

      <h2>2. Encryption Practices</h2>
      <p>
        All data is encrypted in transit using TLS 1.2 or higher and at rest
        using AES-256. Secrets and credentials are stored in managed vaults
        with key rotation policies. Backups are encrypted and stored in
        isolated regions.
      </p>

      <h2>3. Access Controls</h2>
      <p>
        We apply principle-of-least-privilege access. All employee access to
        production data requires SSO with mandatory multi-factor
        authentication, is scoped by role, logged, and reviewed quarterly.
        Row-Level Security policies enforce data boundaries at the database
        layer.
      </p>

      <h2>4. Data Processing Standards</h2>
      <p>
        CONTRIVER processes personal data in accordance with GDPR, CCPA, and
        comparable regulations. We maintain a record of processing
        activities, sign Data Processing Agreements with sub-processors, and
        perform Data Protection Impact Assessments for high-risk features.
      </p>

      <h2>5. User Data Rights</h2>
      <p>
        You can access, correct, export, or delete your data at any time
        through your account settings or by contacting us. Verified requests
        are handled within 30 days. See our <a href="/privacy">Privacy Policy</a>
        for the full list of rights.
      </p>

      <h2>6. Breach Notification Process</h2>
      <p>
        If a security incident affects your personal data, we will notify
        affected users and applicable regulators without undue delay, and in
        any event within 72 hours of confirmation where required by law. Our
        notification will describe the nature of the incident, data
        categories involved, likely consequences, and the steps we are
        taking.
      </p>
    </LegalPageLayout>
  );
}