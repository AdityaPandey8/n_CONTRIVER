import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function Partners() {
  return (
    <LegalPageLayout
      title="Partner with CONTRIVER"
      description="Accelerators, universities, communities, and venture firms — power your programs with CONTRIVER."
      canonical="/partners"
      heading="Power your community with CONTRIVER"
      eyebrow="Partners"
    >
      <p>
        CONTRIVER partners with the organizations that shape the next
        generation of founders. We provide private workspaces, AI tooling,
        analytics, and a curated venue to run your programs end to end.
      </p>

      <h2>Who we partner with</h2>
      <ul>
        <li><strong>Accelerators & incubators</strong> running cohort-based programs.</li>
        <li><strong>Universities & entrepreneurship centers</strong> teaching applied innovation.</li>
        <li><strong>Venture firms</strong> sourcing and supporting portfolio companies.</li>
        <li><strong>Builder communities</strong> hosting hackathons and demo days.</li>
      </ul>

      <h2>What you get</h2>
      <ul>
        <li>Branded private space for your cohort or community.</li>
        <li>AI-powered mentor matching, idea validation, and pitch coaching.</li>
        <li>Program analytics and progress dashboards.</li>
        <li>Direct support from the CONTRIVER team.</li>
      </ul>

      <h2>Get started</h2>
      <p>
        Email <a href="mailto:partners@contriver.app">partners@contriver.app</a>
        with a short note about your program and we'll schedule a call.
      </p>
    </LegalPageLayout>
  );
}