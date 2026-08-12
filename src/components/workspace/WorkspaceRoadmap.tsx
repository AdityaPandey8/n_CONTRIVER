import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Milestone } from "lucide-react";

const MILESTONES = [
  { id: "idea", label: "Idea Defined", description: "Problem & solution documented", checks: ["problem", "solution"] },
  { id: "audience", label: "Audience Identified", description: "Target market defined", checks: ["audience"] },
  { id: "validated", label: "Idea Validated", description: "AI validation score > 50", checks: ["validation"] },
  { id: "strategy", label: "Strategy Built", description: "Business model & GTM plan", checks: ["competitors", "business_model"] },
  { id: "pitch", label: "Pitch Ready", description: "Pitch deck generated", checks: ["pitch"] },
  { id: "investor", label: "Investor Ready", description: "Pitch shared with investors", checks: ["investor"] },
];

interface Props {
  details: Record<string, any>;
  validations: any[];
  hasPitchDeck: boolean;
  hasSharedPitch: boolean;
}

export function WorkspaceRoadmap({ details, validations, hasPitchDeck, hasSharedPitch }: Props) {
  const detailSections = Object.keys(details);
  const latestScore = validations[0]?.overall_score || 0;

  const isComplete = (milestone: typeof MILESTONES[0]) => {
    switch (milestone.id) {
      case "idea": return detailSections.includes("problem") && detailSections.includes("solution");
      case "audience": return detailSections.includes("audience");
      case "validated": return latestScore > 50;
      case "strategy": return detailSections.includes("competitors") || detailSections.includes("business_model");
      case "pitch": return hasPitchDeck;
      case "investor": return hasSharedPitch;
      default: return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Milestone className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Startup Roadmap</h3>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {MILESTONES.map((m, i) => {
            const complete = isComplete(m);
            return (
              <div key={m.id} className="relative flex items-start gap-4 pl-2">
                <div className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full ${complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {complete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </div>
                <Card className={`flex-1 ${complete ? "border-primary/30 bg-primary/5" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{m.label}</h4>
                      {complete && <Badge variant="secondary" className="text-xs">Done</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
