import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function CookiePolicy() {
  return (
    <LegalPageLayout
      title="Cookie Policy | CONTRIVER"
      description="How CONTRIVER uses cookies and similar technologies, and how you can manage your preferences."
      canonical="/cookies"
      heading="Cookie Policy"
      eyebrow="Legal"
      lastUpdated="May 30, 2026"
    >
      <h2>1. What Cookies Are</h2>
      <p>
        Cookies are small text files stored on your device by your browser.
        They allow CONTRIVER to recognize you across pages and sessions,
        remember preferences, and analyze how the platform is used.
      </p>

      <h2>2. Essential Cookies</h2>
      <p>
        These cookies are strictly necessary for the platform to function.
        They keep you signed in, maintain your session state, protect against
        CSRF attacks, and route traffic securely. The Service cannot operate
        without them.
      </p>

      <h2>3. Analytics Cookies</h2>
      <p>
        Analytics cookies help us understand which features are valuable,
        where users get stuck, and how to improve the experience. We
        aggregate this data and never use it to identify individual users
        for advertising.
      </p>

      <h2>4. Performance Cookies</h2>
      <p>
        Performance cookies collect information about page load times, error
        rates, and resource usage so we can keep the platform fast and
        reliable across regions and devices.
      </p>

      <h2>5. Managing Cookie Preferences</h2>
      <p>
        You can control cookies through your browser settings — most browsers
        let you block, delete, or be alerted to cookies. Disabling essential
        cookies will break core functionality such as authentication. You can
        also opt out of non-essential cookies from your account preferences.
      </p>

      <h2>6. Third-Party Cookies</h2>
      <p>
        Some features are powered by third-party services (for example,
        embedded videos, analytics, and payment providers) that may set their
        own cookies. We carefully vet these providers and link to their
        policies where relevant.
      </p>
    </LegalPageLayout>
  );
}