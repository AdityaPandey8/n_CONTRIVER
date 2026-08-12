import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";

interface Props {
  risk_level: string;
  rule_flags?: string[];
  ai_risks?: string[];
}

export function RiskMeter({ risk_level, rule_flags = [], ai_risks = [] }: Props) {
  const level = (risk_level || "medium").toLowerCase();
  const meta =
    level === "high"
      ? { color: "bg-red-500/15 text-red-500 border-red-500/30", Icon: ShieldAlert, label: "High Risk" }
      : level === "low"
      ? { color: "bg-green-500/15 text-green-500 border-green-500/30", Icon: ShieldCheck, label: "Low Risk" }
      : { color: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", Icon: AlertTriangle, label: "Medium Risk" };

  return (
    <Card className="bg-card/80 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Failure Prediction</span>
          <Badge variant="outline" className={meta.color}>
            <meta.Icon className="h-3.5 w-3.5 mr-1" />{meta.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {(rule_flags ?? []).length > 0 && (
          <div>
            <p className="font-medium mb-1">Rule-based flags</p>
            <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
              {(rule_flags ?? []).map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
        {(ai_risks ?? []).length > 0 && (
          <div>
            <p className="font-medium mb-1">AI-detected risks</p>
            <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
              {(ai_risks ?? []).map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
        {(rule_flags ?? []).length === 0 && (ai_risks ?? []).length === 0 && (
          <p className="text-muted-foreground">No risks detected yet. Run validation first.</p>
        )}
      </CardContent>
    </Card>
  );
}
