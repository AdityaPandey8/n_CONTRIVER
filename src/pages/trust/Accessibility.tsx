import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function Accessibility() {
  return (
    <LegalPageLayout
      title="Accessibility | CONTRIVER"
      description="Our commitment to building an inclusive, accessible platform for every founder and member."
      canonical="/accessibility"
      heading="Accessibility"
      eyebrow="Trust"
    >
      <p>
        CONTRIVER is committed to building a platform that works for
        everyone, regardless of ability, device, or context.
      </p>

      <h2>Our standard</h2>
      <p>
        We design, build, and test against the Web Content Accessibility
        Guidelines (WCAG) 2.1 Level AA. We treat accessibility issues with
        the same priority as functional bugs.
      </p>

      <h2>What we do</h2>
      <ul>
        <li>Semantic HTML and meaningful landmarks throughout the interface.</li>
        <li>Full keyboard navigation and visible focus states.</li>
        <li>Color contrast that meets or exceeds AA in light and dark modes.</li>
        <li>Screen-reader-friendly labels, descriptions, and live regions.</li>
        <li>Respect for reduced-motion and high-contrast user preferences.</li>
      </ul>

      <h2>Known limitations</h2>
      <p>
        Some third-party embeds and beta features may not yet meet our
        accessibility bar. We disclose known issues and prioritize fixes
        each quarter.
      </p>

      <h2>Feedback</h2>
      <p>
        If you experience an accessibility barrier, please tell us at
        <a href="mailto:accessibility@contriver.app"> accessibility@contriver.app</a>.
        We aim to respond within 5 business days.
      </p>
    </LegalPageLayout>
  );
}