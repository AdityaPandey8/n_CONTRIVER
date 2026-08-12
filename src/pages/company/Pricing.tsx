import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const tiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Everything you need to validate your first idea.",
    features: [
      "1 active idea workspace",
      "AI Mentor (limited)",
      "Community feed access",
      "Basic pitch deck generator",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "per month",
    description: "For founders actively building and pitching.",
    features: [
      "Unlimited idea workspaces",
      "Full AI Mentor, Strategy & Pitch tools",
      "Investor discovery and outreach",
      "Priority support",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual",
    description: "For accelerators, universities, and venture firms.",
    features: [
      "Branded private workspace",
      "Program analytics and dashboards",
      "Dedicated success manager",
      "SSO, SCIM, and custom DPA",
    ],
  },
];

export default function Pricing() {
  return (
    <LegalPageLayout
      title="Pricing | CONTRIVER"
      description="Simple plans for founders, builders, and the programs that support them. Start free, upgrade when ready."
      canonical="/pricing"
      heading="Simple, founder-friendly pricing"
      eyebrow="Pricing"
    >
      <p>
        Start free, upgrade when you're ready, talk to us when you scale.
        Every plan includes core community access and product updates.
      </p>
      <div className="not-prose mt-10 grid gap-6 sm:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl border p-6 bg-card text-card-foreground shadow-sm ${
              tier.featured ? "border-primary shadow-lg" : "border-border"
            }`}
          >
            <h3 className="font-display text-xl font-semibold text-foreground">{tier.name}</h3>
            <p className="mt-3 text-3xl font-bold text-foreground">{tier.price}</p>
            <p className="text-sm text-muted-foreground">{tier.cadence}</p>
            <p className="mt-4 text-sm text-muted-foreground">{tier.description}</p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </LegalPageLayout>
  );
}