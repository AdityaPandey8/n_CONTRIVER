import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function TermsOfService() {
  return (
    <LegalPageLayout
      title="Terms of Service | CONTRIVER"
      description="The terms governing your use of the CONTRIVER platform, including rights, responsibilities, and limitations."
      canonical="/terms"
      heading="Terms of Service"
      eyebrow="Legal"
      lastUpdated="May 30, 2026"
    >
      <p>
        These Terms of Service ("Terms") govern your access to and use of the
        CONTRIVER platform, websites, and related services (collectively, the
        "Service"). By using the Service you agree to be bound by these Terms.
      </p>

      <h2>1. Platform Usage</h2>
      <p>
        CONTRIVER provides tools and a community for founders, mentors,
        investors, and builders to validate ideas, collaborate, and ship
        startups. You may use the Service only in compliance with these Terms
        and all applicable laws.
      </p>

      <h2>2. User Responsibilities</h2>
      <p>You are responsible for:</p>
      <ul>
        <li>The accuracy of information you provide.</li>
        <li>All content you publish, share, or transmit through the Service.</li>
        <li>Safeguarding your account credentials and authorized devices.</li>
        <li>Respecting other users, intellectual property, and platform rules.</li>
      </ul>

      <h2>3. Account Requirements</h2>
      <p>
        You must be at least 16 years old to create an account. You must
        provide accurate registration information and keep it current. One
        person or legal entity may not maintain more than one free account
        except as expressly permitted.
      </p>

      <h2>4. Intellectual Property</h2>
      <p>
        CONTRIVER and its licensors own all rights to the platform software,
        branding, and original content. You retain ownership of the content
        you submit, and grant us a worldwide, non-exclusive, royalty-free
        license to host, display, and distribute that content solely to
        operate and improve the Service.
      </p>

      <h2>5. Prohibited Activities</h2>
      <p>You may not:</p>
      <ul>
        <li>Use the Service for any unlawful, fraudulent, or harmful purpose.</li>
        <li>Reverse-engineer, scrape, or interfere with the Service.</li>
        <li>Upload malware, spam, or content that infringes others' rights.</li>
        <li>Misrepresent your identity, affiliation, or qualifications.</li>
        <li>Attempt to gain unauthorized access to accounts or systems.</li>
      </ul>
      <p>See our <a href="/acceptable-use">Acceptable Use Policy</a> for full details.</p>

      <h2>6. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, CONTRIVER and its affiliates
        will not be liable for any indirect, incidental, special,
        consequential, or punitive damages, or any loss of profits, revenue,
        data, or goodwill arising out of or relating to your use of the
        Service. Our aggregate liability for any claim is limited to the
        amounts you paid us in the twelve months preceding the claim, or USD
        $100 if greater.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time.
        We may suspend or terminate your access if you violate these Terms,
        create risk for other users, or as required by law. Provisions that
        by their nature should survive termination will survive.
      </p>

      <h2>8. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the jurisdiction in which
        CONTRIVER is incorporated, without regard to its conflict-of-laws
        rules. Disputes will be resolved exclusively in the courts of that
        jurisdiction, unless mandatory consumer protection laws provide
        otherwise.
      </p>

      <h2>9. Contact Information</h2>
      <p>
        Questions about these Terms? Reach our legal team at
        <a href="mailto:legal@contriver.app"> legal@contriver.app</a>.
      </p>
    </LegalPageLayout>
  );
}