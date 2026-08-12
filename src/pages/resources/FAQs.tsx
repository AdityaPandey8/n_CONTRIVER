import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What exactly is CONTRIVER?",
    a: "CONTRIVER is an AI-native platform for founders. It combines an ideation hub, a strategy and pitch studio, an investor network, mentors, and a community feed in one place.",
  },
  {
    q: "Who is it for?",
    a: "Founders building or thinking about building a startup, mentors who want to give back, investors sourcing early opportunities, and operators looking for their next thing.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The Free plan gives you a single idea workspace, community access, and limited AI usage. Upgrade to Pro when you're actively building and pitching.",
  },
  {
    q: "How does the AI work?",
    a: "We use the Lovable AI Gateway to route requests to best-in-class models for each task — mentorship dialogue, strategy generation, pitch coaching, and ideation. Your data is never used to train third-party models.",
  },
  {
    q: "Can I delete my account and data?",
    a: "Yes. You can delete your account from settings at any time. We remove or anonymize personal data within 30 days, except where retention is legally required.",
  },
  {
    q: "Do you support teams or accelerators?",
    a: "Yes. Our Enterprise plan supports branded workspaces, analytics, and dedicated success management. See the Partners page to get started.",
  },
];

export default function FAQs() {
  return (
    <LegalPageLayout
      title="FAQs | CONTRIVER"
      description="Answers to the most common questions about CONTRIVER, pricing, AI features, and account management."
      canonical="/faqs"
      heading="Frequently asked questions"
      eyebrow="Resources"
    >
      <div className="not-prose">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold text-foreground">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </LegalPageLayout>
  );
}