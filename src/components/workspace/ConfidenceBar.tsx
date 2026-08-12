import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";

export function ConfidenceBar({ confidence, inputs }: { confidence: number; inputs?: any }) {
  const color = confidence >= 75 ? "bg-green-500" : confidence >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <TooltipProvider>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            Decision Confidence
            <Tooltip>
              <TooltipTrigger><Info className="h-3.5 w-3.5" /></TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-0.5">
                  <div>Consistency: {inputs?.consistency ?? "-"}%</div>
                  <div>Completeness: {inputs?.completeness ?? "-"}%</div>
                  <div>Clarity: {inputs?.clarity ?? "-"}%</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </span>
          <span className="font-semibold">{confidence}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full ${color} transition-all`} style={{ width: `${confidence}%` }} />
        </div>
      </div>
    </TooltipProvider>
  );
}
