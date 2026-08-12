import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function About() {
  return (
    <LegalPageLayout
      title="About CONTRIVER — Our Mission"
      description="CONTRIVER is the AI-native ecosystem where founders, mentors, and investors turn ideas into world-changing startups."
      canonical="/about"
      heading="Building the operating system for founders"
      eyebrow="About us"
    >
      <h2>Our mission</h2>
      <p>
        Empower every innovator on the planet to transform raw ideas into
        durable startups — faster, with less guesswork, and with a community
        that genuinely wants them to win.
      </p>

      <h2>Our vision</h2>
      <p>
        A world where the distance between a notebook scribble and a shipped
        product is measured in days, not years. Where capital, mentorship,
        and talent flow to the best ideas regardless of geography.
      </p>

      <h2>How we got here</h2>
      <p>
        CONTRIVER was born out of a simple observation: founders waste most
        of their time on the wrong things. Validating the wrong idea.
        Talking to the wrong investor. Hiring the wrong first engineer. We
        set out to build an AI-native platform that compresses those cycles
        and pairs intelligent tools with a community of operators.
      </p>

      <h2>What we value</h2>
      <ul>
        <li><strong>Builders first.</strong> Every decision is filtered through "does this help a founder ship?"</li>
        <li><strong>Honest by default.</strong> Sharp feedback beats polite vagueness.</li>
        <li><strong>Compound learning.</strong> We document what works so the next founder doesn't repeat the same lesson.</li>
        <li><strong>Global by design.</strong> Talent and ideas are everywhere; opportunity should be too.</li>
      </ul>
    </LegalPageLayout>
  );
}