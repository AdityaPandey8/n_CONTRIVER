import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

/**
 * Shown for dashboard routes that are frozen for V1 (see
 * src/lib/featureFlags.ts). The underlying page/route still exists and
 * works — this is what renders in its place while the feature is frozen.
 */
export default function ComingSoon({
  title = "Coming Soon",
  description = "This part of CONTRIVER isn't part of the current version yet — we're focused on the core idea-building experience for now. It'll be back in a future release.",
}: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mb-6 text-muted-foreground">{description}</p>
        <Button asChild>
          <Link to="/dashboard">Back to your workspace</Link>
        </Button>
      </div>
    </div>
  );
}
