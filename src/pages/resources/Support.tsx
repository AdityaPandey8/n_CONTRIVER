import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function Support() {
  return (
    <LegalPageLayout
      title="Support | CONTRIVER"
      description="Get help from the CONTRIVER team. Support tiers, response times, and contact options."
      canonical="/support"
      heading="Support"
      eyebrow="Resources"
    >
      <p>
        We're here to help you keep shipping. Pick the channel that fits
        your situation.
      </p>

      <h2>Self-serve</h2>
      <p>
        Start with the <a href="/help">Help Center</a> and
        <a href="/docs"> Documentation</a>. Most common questions are covered
        there with step-by-step instructions.
      </p>

      <h2>Email support</h2>
      <p>
        Free and Pro plans: email <a href="mailto:support@contriver.app">support@contriver.app</a>.
        Expect a response within 1 business day.
      </p>

      <h2>Priority support</h2>
      <p>
        Pro and Enterprise customers receive priority routing, dedicated
        Slack channels, and named contacts. We commit to a 4-hour response
        time during business hours for critical issues.
      </p>

      <h2>Incident response</h2>
      <p>
        Suspect a platform outage? Check <a href="/status">Status</a> first.
        For confirmed incidents we'll post updates there until resolution.
      </p>
    </LegalPageLayout>
  );
}