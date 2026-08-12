import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Rocket, Users, Lightbulb, Trophy, MessageSquare, TrendingUp, Sparkles, Target } from "lucide-react";
import { useRef, MouseEvent } from "react";

const features = [
  { icon: Rocket, title: "Startup Showcase", description: "Launch your startup profile, share your journey, and get discovered by mentors and investors worldwide.", color: "from-indigo-500 to-violet-500" },
  { icon: Users, title: "Expert Mentorship", description: "Book 1-on-1 sessions with verified industry mentors. Get personalized guidance to accelerate your growth.", color: "from-blue-500 to-indigo-500" },
  { icon: Trophy, title: "Hackathons & Challenges", description: "Compete in innovation challenges, win prizes, and showcase your problem-solving skills to the community.", color: "from-emerald-500 to-teal-500" },
  { icon: Lightbulb, title: "Idea Hub", description: "Share and discover breakthrough ideas. Get feedback, find co-founders, and turn concepts into reality.", color: "from-amber-500 to-yellow-500" },
  { icon: Sparkles, title: "AI-Powered Insights", description: "Get instant feedback on your pitch deck, business model analysis, and personalized startup advice.", color: "from-violet-500 to-purple-500" },
  { icon: TrendingUp, title: "Investor Connect", description: "Access a curated network of investors actively looking to fund the next generation of startups.", color: "from-cyan-500 to-blue-500" },
  { icon: Target, title: "Problem Bank", description: "Explore real-world problems from industries and organizations. Find your next startup opportunity.", color: "from-rose-500 to-pink-500" },
  { icon: MessageSquare, title: "Community Feed", description: "Engage with founders, share learnings from failures, and build meaningful connections in the ecosystem.", color: "from-teal-500 to-emerald-500" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function TiltCard({ feature }: { feature: typeof features[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  function handleMouse(e: MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className="group relative"
    >
      <div className="glass-card relative h-full p-7">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-5 shadow-md`}>
          <feature.icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-2 tracking-tight">
          {feature.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-64 w-96 h-96 rounded-full opacity-30" style={{ background: "radial-gradient(circle, hsl(239 84% 67% / 0.1), transparent 70%)" }} />
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 rounded-full opacity-30" style={{ background: "radial-gradient(circle, hsl(250 70% 72% / 0.1), transparent 70%)" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5 tracking-wide uppercase">
              Everything You Need
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              One platform. <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>Every step.</span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              From ideation to funding, we provide all the tools and connections you need to build and scale your startup.
            </p>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 perspective-1000"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <TiltCard feature={feature} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
