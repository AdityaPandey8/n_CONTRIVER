import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-32 sm:pt-40 sm:pb-40">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-40 right-[-10%] w-[640px] h-[640px] rounded-full opacity-70"
          style={{ background: "radial-gradient(circle, hsl(258 90% 76% / 0.28), transparent 60%)" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-[520px] h-[520px] rounded-full opacity-70"
          style={{ background: "radial-gradient(circle, hsl(238 95% 67% / 0.20), transparent 60%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(222 47% 11% / 0.04) 1px, transparent 1px), linear-gradient(to bottom, hsl(222 47% 11% / 0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-foreground"
          >
            Build the Next{" "}
            <span className="relative inline-block">
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                Big Thing
              </span>
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: "var(--gradient-primary)",
                  transformOrigin: "left",
                }}
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-2 h-[3px] sm:h-[4px] rounded-full"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed"
          >
            Powered by your brain and AI — taking your ideas from nothing to Infinity. A complete Ecosystem on one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex justify-center"
          >
            <Button
              size="lg"
              className="gradient-primary text-primary-foreground rounded-xl shadow-glow hover:-translate-y-0.5 transition-all group text-base px-7 h-12"
              asChild
            >
              <Link to="/auth">
                Start Building Free
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
