import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ShortPlayer } from "@/components/social";
import { useShorts } from "@/hooks/useShorts";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "For You" },
  { id: "innovation", label: "Innovation" },
  { id: "tech", label: "Tech" },
  { id: "startups", label: "Startups" },
  { id: "business", label: "Business" },
];

export default function Shorts() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { shorts, isLoading, incrementViews } = useShorts(
    activeCategory === "all" ? undefined : activeCategory
  );

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < shorts.length) {
      setCurrentIndex(newIndex);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No shorts available yet.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6">
      {/* Category pills */}
      <div className="flex gap-2 p-4 overflow-x-auto bg-background/80 backdrop-blur-sm z-10">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Shorts container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {shorts.map((short, index) => (
          <div
            key={short.id}
            className="h-full w-full snap-start snap-always"
            style={{ height: "calc(100vh - 8rem)" }}
          >
            <ShortPlayer
              short={short}
              isActive={index === currentIndex}
              onViewed={() => incrementViews.mutate(short.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
