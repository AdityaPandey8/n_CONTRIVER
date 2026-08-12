import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function Community() {
  return (
    <LegalPageLayout
      title="Community | CONTRIVER"
      description="Connect with founders, mentors, and investors across CONTRIVER's global community channels."
      canonical="/community"
      heading="Join the CONTRIVER community"
      eyebrow="Resources"
    >
      <p>
        CONTRIVER is built around people. Find your tribe, ship in public,
        and learn from operators who have done it before.
      </p>

      <h2>In-product community</h2>
      <ul>
        <li>Social feed for posts, milestones, and asks.</li>
        <li>Vertical "SeedShorts" videos from builders.</li>
        <li>Direct messaging once you connect.</li>
      </ul>

      <h2>Events</h2>
      <ul>
        <li>Monthly virtual demo days open to all members.</li>
        <li>Themed hackathons sponsored by partners.</li>
        <li>Local meetups in major startup hubs.</li>
      </ul>

      <h2>Code of conduct</h2>
      <p>
        Be kind, be specific, and assume good intent. Harassment,
        discrimination, and spam are not tolerated. See our
        <a href="/acceptable-use"> Acceptable Use Policy</a> for details.
      </p>
    </LegalPageLayout>
  );
}