import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tips = [
  {
    title: "Complete Your Profile",
    description: "A complete profile increases your visibility by 3x to mentors and investors.",
  },
  {
    title: "Join a Hackathon",
    description: "Hackathons are great for networking and validating your ideas quickly.",
  },
  {
    title: "Connect with Mentors",
    description: "Book a session with an experienced mentor to get personalized guidance.",
  },
  {
    title: "Share Your Ideas",
    description: "Post your ideas in the Ideas Hub to get feedback from the community.",
  },
];

interface QuickTipsProps {
  delay?: number;
}

export function QuickTips({ delay = 0 }: QuickTipsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tips.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-warning/10">
              <Lightbulb className="h-4 w-4 text-warning" />
            </div>
            <span className="text-sm font-semibold text-foreground">Quick Tips</span>
          </div>
          
          <div className="relative min-h-[80px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h4 className="font-medium text-foreground mb-1">
                  {tips[currentIndex].title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {tips[currentIndex].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1.5">
              {tips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? "bg-primary w-4" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={goToPrevious} className="h-7 w-7 rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNext} className="h-7 w-7 rounded-full">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
