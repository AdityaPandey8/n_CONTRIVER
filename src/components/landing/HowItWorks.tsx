import { motion } from "framer-motion";
import { UserPlus, Handshake, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up",
    description: "Create your free account in seconds. Tell us about your role — founder, mentor, or investor.",
    step: "01",
  },
  {
    icon: Handshake,
    title: "Connect",
    description: "Find mentors, co-founders, and investors who share your vision. Join hackathons and ideation sessions.",
    step: "02",
  },
  {
    icon: Rocket,
    title: "Launch",
    description: "Refine your pitch with AI feedback, build your team, and take your startup from idea to reality.",
    step: "03",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, rotateX: -15 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export function HowItWorks() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5 tracking-wide uppercase">
              How It Works
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Three steps to your breakthrough
            </h2>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto perspective-1000"
        >
          {steps.map((step, index) => (
            <motion.div key={step.title} variants={itemVariants} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-accent/40 to-transparent z-0" />
              )}

              <div className="glass-card relative h-full p-8 text-center group">
                {/* Step number */}
                <div className="absolute top-4 right-5 text-5xl font-black text-primary/10 select-none">
                  {step.step}
                </div>

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary shadow-glow mb-6 mx-auto"
                >
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </motion.div>

                <h3 className="font-display text-xl font-semibold text-foreground mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
