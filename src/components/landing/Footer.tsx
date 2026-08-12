import { Rocket } from "lucide-react";
import { Link } from "react-router-dom";

type FooterLink = { name: string; href: string; external?: boolean };

const footerLinks: Record<string, FooterLink[]> = {
  product: [
    { name: "Features", href: "/#features" },
    { name: "Startups", href: "/#startups" },
    { name: "Mentors", href: "/#mentors" },
    { name: "Investors", href: "/#investors" },
    { name: "Pricing", href: "/pricing" },
  ],
  resources: [
    { name: "Help Center", href: "/help" },
    { name: "Documentation", href: "/docs" },
    { name: "Community", href: "/community" },
    { name: "Support", href: "/support" },
    { name: "FAQs", href: "/faqs" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
    { name: "Careers", href: "/careers" },
    { name: "Partners", href: "/partners" },
    { name: "Press Kit", href: "/press" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Data Protection", href: "/data-protection" },
    { name: "Acceptable Use Policy", href: "/acceptable-use" },
  ],
};

const trustLinks: FooterLink[] = [
  { name: "Security", href: "/security" },
  { name: "Status", href: "/status" },
  { name: "Accessibility", href: "/accessibility" },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    "text-sm text-muted-foreground hover:text-primary transition-colors";
  if (link.href.startsWith("#") || link.href.startsWith("/#") || link.external) {
    return (
      <a href={link.href} className={className}>
        {link.name}
      </a>
    );
  }
  return (
    <Link to={link.href} className={className}>
      {link.name}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[320px] -z-10 opacity-50"
        style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.18), transparent 70%)" }}
      />
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 gradient-primary rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative flex items-center justify-center w-9 h-9 gradient-primary rounded-lg">
                  <Rocket className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-foreground">
                CONTRIVER
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Empowering innovators to transform ideas into startups through
              AI-powered collaboration, mentorship, funding, and execution.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="font-semibold text-foreground mb-3 capitalize">{category}</h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.name}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {trustLinks.map((link) => (
              <FooterLinkItem key={link.name} link={link} />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CONTRIVER — INNOV8. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">Made with ❤️ for innovators worldwide</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
