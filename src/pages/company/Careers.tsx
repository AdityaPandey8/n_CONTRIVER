import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function Careers() {
  return (
    <LegalPageLayout
      title="Careers at CONTRIVER — Join the team"
      description="Help us build the AI-native operating system for founders. Remote-first, async-by-default, and built on trust."
      canonical="/careers"
      heading="Build with us"
      eyebrow="Careers"
    >
      <h2>Why CONTRIVER</h2>
      <p>
        We're a small, opinionated team obsessed with helping founders
        succeed. We're remote-first, async-by-default, and ship in tight
        loops. Expect ownership from day one and the autonomy to back it up.
      </p>

      <h2>How we work</h2>
      <ul>
        <li>Distributed across timezones, anchored by a common operating cadence.</li>
        <li>Written-first culture — decisions, designs, and reviews live in docs.</li>
        <li>Quarterly in-person offsites for the whole team.</li>
        <li>Generous equity, learning budgets, and meaningful PTO.</li>
      </ul>

      <h2>Open roles</h2>
      <p>
        We're not actively hiring for specific roles right now, but we're
        always interested in exceptional engineers, designers, and operators.
        If that's you, send a short note and your portfolio to
        <a href="mailto:careers@contriver.app"> careers@contriver.app</a>.
      </p>
    </LegalPageLayout>
  );
}