import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy Policy | CONTRIVER"
      description="How CONTRIVER collects, uses, stores, and protects personal information across the platform."
      canonical="/privacy"
      heading="Privacy Policy"
      eyebrow="Legal"
      lastUpdated="May 30, 2026"
    >
      <p>
        CONTRIVER ("we", "us", "our") is committed to protecting the privacy of
        founders, mentors, investors, and every member of our ecosystem. This
        Privacy Policy explains what information we collect, how we use it, and
        the rights you have over your data.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We collect the following categories of information:</p>
      <ul>
        <li><strong>Account information:</strong> name, email address, password hash, role (founder, mentor, investor, etc.), and profile details you choose to share.</li>
        <li><strong>Content you create:</strong> ideas, posts, pitch decks, comments, messages, and uploaded media.</li>
        <li><strong>Usage data:</strong> pages visited, features used, interactions, and approximate location derived from IP.</li>
        <li><strong>Device data:</strong> browser type, operating system, device identifiers, and crash logs.</li>
        <li><strong>Payment data:</strong> billing details processed by our payment partners; we never store full card numbers.</li>
      </ul>

      <h2>2. How We Use Data</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Operate, maintain, and improve the CONTRIVER platform.</li>
        <li>Personalize your experience and surface relevant matches.</li>
        <li>Power AI features such as the AI Mentor, Strategy Builder, and Pitch Deck generator.</li>
        <li>Send transactional notifications, security alerts, and product updates.</li>
        <li>Detect, investigate, and prevent fraud, abuse, and security incidents.</li>
        <li>Comply with legal obligations and enforce our policies.</li>
      </ul>

      <h2>3. User Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account
        credentials and for all activity that occurs under your account. You
        must notify us immediately of any unauthorized use. We may suspend or
        terminate accounts that violate our Terms of Service or Acceptable Use
        Policy.
      </p>

      <h2>4. Cookies & Analytics</h2>
      <p>
        We use cookies and similar technologies to keep you signed in,
        remember preferences, and understand how the platform is used. For
        details, see our <a href="/cookies">Cookie Policy</a>.
      </p>

      <h2>5. Data Storage & Security</h2>
      <p>
        Your data is stored on secure infrastructure provided by Supabase and
        encrypted both at rest (AES-256) and in transit (TLS 1.2+). We apply
        strict Row-Level Security policies, principle-of-least-privilege
        access controls, and continuous monitoring. See our
        <a href="/data-protection"> Data Protection</a> page for more.
      </p>

      <h2>6. Third-Party Services</h2>
      <p>
        We rely on a small set of vetted vendors to operate the platform,
        including Supabase (database, auth, storage), the Lovable AI Gateway
        (AI inference), and analytics providers. These vendors process data
        only on our behalf under contractual obligations.
      </p>

      <h2>7. User Rights</h2>
      <p>Depending on your jurisdiction, you may have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate or incomplete data.</li>
        <li>Request deletion of your account and associated data.</li>
        <li>Export your data in a portable format.</li>
        <li>Object to or restrict certain processing activities.</li>
        <li>Withdraw consent where processing is consent-based.</li>
      </ul>

      <h2>8. Data Retention</h2>
      <p>
        We retain personal data only as long as necessary to provide the
        service, comply with legal obligations, resolve disputes, and enforce
        agreements. When you delete your account, we remove or anonymize
        personal data within 30 days, except where retention is legally
        required.
      </p>

      <h2>9. Contact Information</h2>
      <p>
        For privacy questions or to exercise any of the rights above, contact
        our Data Protection team at <a href="mailto:privacy@contriver.app">privacy@contriver.app</a>.
      </p>
    </LegalPageLayout>
  );
}