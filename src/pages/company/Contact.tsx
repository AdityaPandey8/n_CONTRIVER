import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function Contact() {
  return (
    <LegalPageLayout
      title="Contact CONTRIVER — Get in touch"
      description="Reach the CONTRIVER team for support, partnerships, press, or general inquiries."
      canonical="/contact"
      heading="Talk to us"
      eyebrow="Contact"
    >
      <p>
        We read every message. Pick the inbox that fits your question and
        we'll respond within one business day.
      </p>

      <h2>General inquiries</h2>
      <p><a href="mailto:hello@contriver.app">hello@contriver.app</a></p>

      <h2>Product support</h2>
      <p>
        Stuck somewhere in the platform? Email <a href="mailto:support@contriver.app">support@contriver.app</a>
        or visit our <a href="/help">Help Center</a>.
      </p>

      <h2>Partnerships</h2>
      <p>
        Accelerators, incubators, universities, and venture firms — we'd love
        to collaborate. Reach out at <a href="mailto:partners@contriver.app">partners@contriver.app</a>.
      </p>

      <h2>Press & media</h2>
      <p>
        For interviews, quotes, and assets, contact <a href="mailto:press@contriver.app">press@contriver.app</a>
        or grab our <a href="/press">Press Kit</a>.
      </p>

      <h2>Support hours</h2>
      <p>Monday – Friday, 9:00 to 18:00 (CET). Critical incidents are monitored 24/7.</p>
    </LegalPageLayout>
  );
}