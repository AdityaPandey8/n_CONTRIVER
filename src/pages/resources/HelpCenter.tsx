import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function HelpCenter() {
  return (
    <LegalPageLayout
      title="Help Center | CONTRIVER"
      description="Guides and how-tos for getting the most out of CONTRIVER's AI tools and community."
      canonical="/help"
      heading="Help Center"
      eyebrow="Resources"
    >
      <p>Browse topics or contact <a href="mailto:support@contriver.app">support@contriver.app</a> for direct help.</p>

      <h2>Getting started</h2>
      <ul>
        <li>Creating your account and choosing a role</li>
        <li>Setting up your profile for discovery</li>
        <li>Tour of your personalized dashboard</li>
      </ul>

      <h2>Working with ideas</h2>
      <ul>
        <li>Capturing an idea in the Ideation Hub</li>
        <li>Using the Strategy Builder to pressure-test assumptions</li>
        <li>Running the AI validator and reading confidence scores</li>
      </ul>

      <h2>Pitching & fundraising</h2>
      <ul>
        <li>Generating a pitch deck with the AI studio</li>
        <li>Discovering and shortlisting investors</li>
        <li>Sharing your deck securely</li>
      </ul>

      <h2>Community & networking</h2>
      <ul>
        <li>Posting, commenting, and following members</li>
        <li>Sending and accepting connection requests</li>
        <li>Joining hackathons and applying to jobs</li>
      </ul>

      <h2>Account & billing</h2>
      <ul>
        <li>Managing your subscription and invoices</li>
        <li>Updating security settings and two-factor authentication</li>
        <li>Exporting or deleting your data</li>
      </ul>
    </LegalPageLayout>
  );
}