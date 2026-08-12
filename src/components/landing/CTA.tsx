import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[28px] overflow-hidden border border-border/60"
        >
          <div className="absolute inset-0 gradient-primary" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25), transparent 45%)",
            }}
          />

          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                x: [0, i % 2 === 0 ? 20 : -20, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 6 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8,
              }}
              className="absolute rounded-full"
              style={{
                width: 60 + i * 30,
                height: 60 + i * 30,
                top: `${15 + i * 15}%`,
                left: `${10 + i * 18}%`,
                background: `radial-gradient(circle, hsl(${i % 2 === 0 ? "239 84% 67%" : "250 70% 72%"} / ${0.1 + i * 0.03}), transparent 70%)`,
                transform: `translateZ(${i * 20}px)`,
              }}
            />
          ))}

          <div className="relative px-6 py-16 sm:px-12 sm:py-24 text-center">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur border border-white/25 mb-8"
              >
                <Rocket className="w-8 h-8 text-primary-foreground" />
              </motion.div>

              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
                Ready to build something great?
              </h2>

              <p className="mt-6 text-lg text-white/80 max-w-xl mx-auto">
                Join founders, mentors, and investors building the future.
                Your next breakthrough is just one click away.
              </p>

              <div className="mt-10">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/95 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all group text-base px-8 h-12"
                  asChild
                >
                  <Link to="/auth">
                    Get Started Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
