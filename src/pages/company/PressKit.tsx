import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function PressKit() {
  return (
    <LegalPageLayout
      title="Press Kit | CONTRIVER"
      description="Brand assets, boilerplate, and press contact for journalists and partners covering CONTRIVER."
      canonical="/press"
      heading="Press Kit"
      eyebrow="Press"
    >
      <h2>Company boilerplate</h2>
      <p>
        CONTRIVER is the AI-native ecosystem where founders, mentors, and
        investors validate ideas, connect, and ship breakthrough startups.
        Built around an opinionated workflow and powered by modern AI, the
        platform compresses the cycle from concept to launch.
      </p>

      <h2>Quick facts</h2>
      <ul>
        <li><strong>Founded:</strong> 2025</li>
        <li><strong>Headquarters:</strong> Distributed, remote-first</li>
        <li><strong>Category:</strong> Startup ecosystem · AI · Community</li>
        <li><strong>Audience:</strong> Founders, mentors, investors, students, builders</li>
      </ul>

      <h2>Brand assets</h2>
      <p>
        Logos, wordmarks, and product screenshots are available on request.
        Please email <a href="mailto:press@contriver.app">press@contriver.app</a>
        with the publication and intended use.
      </p>

      <h2>Brand usage</h2>
      <ul>
        <li>Always use "CONTRIVER" in all caps in body copy and headlines.</li>
        <li>Do not modify the logo's colors, proportions, or spacing.</li>
        <li>Maintain clear space equal to the rocket mark on all sides.</li>
      </ul>

      <h2>Media contact</h2>
      <p><a href="mailto:press@contriver.app">press@contriver.app</a></p>
    </LegalPageLayout>
  );
}