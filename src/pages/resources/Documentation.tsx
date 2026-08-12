import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function Documentation() {
  return (
    <LegalPageLayout
      title="Documentation | CONTRIVER"
      description="Technical and product documentation for the CONTRIVER platform, integrations, and APIs."
      canonical="/docs"
      heading="Documentation"
      eyebrow="Resources"
    >
      <p>
        Reference material for every part of CONTRIVER — from your first
        login to advanced integrations.
      </p>

      <h2>Platform basics</h2>
      <ul>
        <li>Architecture overview and roles</li>
        <li>Glossary of terms and core concepts</li>
        <li>Keyboard shortcuts and productivity tips</li>
      </ul>

      <h2>AI features</h2>
      <ul>
        <li>AI Mentor: prompts, context window, and best practices</li>
        <li>Strategy Builder: inputs, outputs, and iteration loops</li>
        <li>Pitch Deck Studio: templates, exports, and regenerator</li>
        <li>Ideation Hub: domains, budget estimates, and ranking</li>
      </ul>

      <h2>Integrations</h2>
      <ul>
        <li>Calendar and email connectors</li>
        <li>Slack and Discord community sync</li>
        <li>Exporting pitch decks to PPTX and PDF</li>
      </ul>

      <h2>For developers</h2>
      <ul>
        <li>Public API overview (coming soon)</li>
        <li>Webhooks for ecosystem partners</li>
        <li>SSO setup for enterprise workspaces</li>
      </ul>
    </LegalPageLayout>
  );
}