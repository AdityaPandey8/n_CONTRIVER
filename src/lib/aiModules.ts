import { Bot, Compass, Target, BarChart3, Presentation, Lightbulb, type LucideIcon } from "lucide-react";

export type AIModuleKey =
  | "mentor"
  | "explorer"
  | "strategy"
  | "market"
  | "pitch_feedback"
  | "ideas";

export interface AIModule {
  key: AIModuleKey;
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
  accent: string; // tailwind gradient classes
  placeholder: string;
  suggestions: string[];
}

export const AI_MODULES: AIModule[] = [
  {
    key: "mentor",
    title: "AI Mentor",
    short: "Startup advisor",
    description: "Validate ideas, find PMF, raise funding, grow.",
    icon: Bot,
    accent: "from-indigo-500 to-purple-500",
    placeholder: "Ask anything about your startup journey…",
    suggestions: [
      "How do I validate my idea?",
      "How do I find product-market fit?",
      "How do I raise a pre-seed round?",
      "What KPIs should I track at MVP stage?",
    ],
  },
  {
    key: "explorer",
    title: "Idea Explorer",
    short: "Refine your idea",
    description: "Analyze weaknesses, competitors, differentiation.",
    icon: Compass,
    accent: "from-cyan-500 to-blue-500",
    placeholder: "Paste your idea and I'll stress-test it…",
    suggestions: [
      "Analyze my idea and find weaknesses",
      "Who are my direct and indirect competitors?",
      "How do I differentiate from incumbents?",
      "What objections will investors raise?",
    ],
  },
  {
    key: "strategy",
    title: "Strategy Builder",
    short: "Business + GTM plan",
    description: "Business model, GTM, pricing, growth.",
    icon: Target,
    accent: "from-emerald-500 to-teal-500",
    placeholder: "Describe your product and target market…",
    suggestions: [
      "Build a GTM strategy for my SaaS",
      "Suggest a pricing model and tiers",
      "Design a growth loop for my product",
      "Outline a 90-day launch plan",
    ],
  },
  {
    key: "market",
    title: "Market Analysis",
    short: "TAM / SAM / SOM",
    description: "Market sizing, trends, competitive insights.",
    icon: BarChart3,
    accent: "from-amber-500 to-orange-500",
    placeholder: "Which market should I analyze?",
    suggestions: [
      "Estimate TAM/SAM/SOM for AI tutors in India",
      "Top market trends in fintech for 2026",
      "Competitive landscape for vertical SaaS",
      "Find underserved niches in healthtech",
    ],
  },
  {
    key: "pitch_feedback",
    title: "Pitch Feedback",
    short: "Review your pitch",
    description: "Score, weaknesses, improvements.",
    icon: Presentation,
    accent: "from-rose-500 to-pink-500",
    placeholder: "Paste your pitch or deck summary…",
    suggestions: [
      "Review my elevator pitch",
      "Score my pitch on clarity and persuasiveness",
      "Make my pitch investor-ready",
      "Rewrite my problem slide",
    ],
  },
  {
    key: "ideas",
    title: "AI Ideas Hub",
    short: "Generate new ideas",
    description: "Fresh startup, hackathon, and problem ideas.",
    icon: Lightbulb,
    accent: "from-yellow-500 to-amber-500",
    placeholder: "Which domain should I brainstorm?",
    suggestions: [
      "10 AI startup ideas for education",
      "Hackathon ideas using LLMs",
      "Problems worth solving in climate tech",
      "B2B SaaS ideas for SMBs in India",
    ],
  },
];

export const QUICK_ACTIONS: { label: string; module: AIModuleKey; prompt: string }[] = [
  { label: "Validate Idea", module: "explorer", prompt: "Help me validate my idea: " },
  { label: "Analyze Market", module: "market", prompt: "Analyze the market for: " },
  { label: "Improve Strategy", module: "strategy", prompt: "Improve my GTM strategy for: " },
  { label: "Review Pitch", module: "pitch_feedback", prompt: "Review this pitch:\n\n" },
  { label: "Find Startup Ideas", module: "ideas", prompt: "Generate 5 startup ideas in: " },
];

export function getModule(key: string | undefined): AIModule {
  return AI_MODULES.find((m) => m.key === key) ?? AI_MODULES[0];
}