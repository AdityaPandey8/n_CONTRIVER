import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ConfidenceBar } from "./ConfidenceBar";
import { RiskMeter } from "./RiskMeter";
import { useLatestRisk } from "@/hooks/useIdeaIntelligence";

interface Props {
  workspaceId: string;
  details: Record<string, any>;
  validations: any[];
  workspaceName: string;
}

export function WorkspaceValidation({ workspaceId, details, validations, workspaceName }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);
  const latest = validations[0];
  const { data: risk } = useLatestRisk(workspaceId);

  const runValidation = async () => {
    if (!user) return;
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("idea-validator", {
        body: {
          workspace_name: workspaceName,
          details,
          workspace_id: workspaceId,
        },
      });
      if (error) throw error;

      await supabase.from("idea_validations").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        overall_score: data.overall_score || 0,
        breakdown: data.breakdown || {},
        suggestions: data.suggestions || [],
        confidence: data.confidence ?? 0,
        risk_level: data.risk_level ?? 'medium',
      });

      qc.invalidateQueries({ queryKey: ["workspace-validations", workspaceId] });
      qc.invalidateQueries({ queryKey: ["risk-analysis", workspaceId] });
      qc.invalidateQueries({ queryKey: ["idea-evolution", workspaceId] });
      toast({ title: "Validation complete!" });
    } catch (e: any) {
      toast({ title: "Validation failed", description: e.message, variant: "destructive" });
    } finally {
      setIsValidating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            AI Idea Validation
          </CardTitle>
          <Button onClick={runValidation} disabled={isValidating}>
            {isValidating ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Validating...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Run Validation</>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI will analyze your idea details and provide a score (0-100) with actionable feedback.
            Fill in the Idea Details tab first for best results.
          </p>
        </CardContent>
      </Card>

      {latest && (
        <>
          {/* Score */}
          <Card className="bg-card/80 border-border/50">
            <CardContent className="pt-6 text-center space-y-4">
              <p className={`text-6xl font-bold ${getScoreColor(latest.overall_score)}`}>
                {latest.overall_score}
              </p>
              <p className="text-muted-foreground">Overall Validation Score</p>
              <Progress value={latest.overall_score} className="h-3 max-w-md mx-auto" />
              {typeof latest.confidence === 'number' && latest.confidence > 0 && (
                <div className="max-w-md mx-auto pt-2">
                  <ConfidenceBar confidence={latest.confidence} />
                </div>
              )}
            </CardContent>
          </Card>

          <RiskMeter
            risk_level={risk?.risk_level || latest.risk_level || 'medium'}
            rule_flags={(risk?.rule_flags as string[]) || []}
            ai_risks={(risk?.ai_risks as string[]) || []}
          />

          {/* Breakdown */}
          {latest.breakdown && Object.keys(latest.breakdown).length > 0 && (
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(latest.breakdown).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="font-semibold">{value as number}/100</span>
                    </div>
                    <Progress value={value as number} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {latest.suggestions && (latest.suggestions as any[]).length > 0 && (
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(latest.suggestions as string[]).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
