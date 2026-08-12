import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function AcceptableUse() {
  return (
    <LegalPageLayout
      title="Acceptable Use Policy | CONTRIVER"
      description="Rules for using CONTRIVER responsibly, what is permitted, what is prohibited, and how we enforce."
      canonical="/acceptable-use"
      heading="Acceptable Use Policy"
      eyebrow="Legal"
      lastUpdated="May 30, 2026"
    >
      <p>
        This Acceptable Use Policy ("AUP") applies to every user of the
        CONTRIVER platform. By using the Service, you agree to follow these
        rules in addition to our <a href="/terms">Terms of Service</a>.
      </p>

      <h2>1. Permitted Uses</h2>
      <ul>
        <li>Validating, building, and launching legitimate startups and projects.</li>
        <li>Connecting with mentors, investors, collaborators, and talent.</li>
        <li>Sharing learnings, feedback, and constructive critique with the community.</li>
        <li>Using AI tools to accelerate ideation, strategy, and execution.</li>
      </ul>

      <h2>2. Prohibited Conduct</h2>
      <p>You may not use the Service to:</p>
      <ul>
        <li>Engage in fraud, money laundering, or pyramid schemes.</li>
        <li>Harass, threaten, dox, or discriminate against any person or group.</li>
        <li>Distribute malware, phishing links, or unauthorized access tools.</li>
        <li>Spam, mass-message, or scrape data from other users.</li>
        <li>Impersonate another person, company, or affiliation.</li>
        <li>Bypass rate limits, security controls, or access restrictions.</li>
      </ul>

      <h2>3. Platform Abuse Prevention</h2>
      <p>
        We employ automated and manual systems to detect abuse, including
        rate limiting, anomaly detection, content moderation, and trust &
        safety review. Users who attempt to circumvent these systems are
        subject to enforcement.
      </p>

      <h2>4. Content Standards</h2>
      <p>Content posted to CONTRIVER must:</p>
      <ul>
        <li>Be accurate and not deliberately misleading.</li>
        <li>Respect intellectual property rights.</li>
        <li>Avoid sexually explicit, violent, or hateful material.</li>
        <li>Comply with all applicable laws and platform guidelines.</li>
      </ul>

      <h2>5. Enforcement Actions</h2>
      <p>
        Depending on severity, violations may result in content removal,
        warnings, feature restrictions, temporary suspension, or permanent
        account termination. We may also report illegal activity to relevant
        authorities. Report abuse to <a href="mailto:trust@contriver.app">trust@contriver.app</a>.
      </p>
    </LegalPageLayout>
  );
}