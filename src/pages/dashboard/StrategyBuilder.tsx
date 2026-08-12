import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Loader2, Sparkles, ChevronRight, ChevronDown, Save, Download, AlertCircle, History, Copy, Check, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStrategyBuilder, useStrategyHistory } from "@/hooks/useAIChat";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function StrategyBuilder() {
  const { toast } = useToast();
  const { generateStrategy, isLoading } = useStrategyBuilder();
  const { data: history = [], refetch: refetchHistory } = useStrategyHistory();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [viewingHistory, setViewingHistory] = useState(false);
  
  const [formData, setFormData] = useState({
    ideaDescription: "",
    targetMarket: "",
    budgetConstraints: "",
  });

  const handleGenerate = async () => {
    if (!formData.ideaDescription) {
      toast({ title: "Please describe your idea", variant: "destructive" });
      return;
    }

    setError(null);
    setViewingHistory(false);
    try {
      const data = await generateStrategy({
        ideaDescription: formData.ideaDescription,
        targetMarket: formData.targetMarket || undefined,
        budgetConstraints: formData.budgetConstraints || undefined,
      });
      setResult(data);
      refetchHistory();
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        setError("AI features are temporarily unavailable due to high demand. Please try again in a few minutes.");
      } else {
        setError(err.message || "Failed to generate strategy. Please try again.");
      }
    }
  };

  const loadHistoryItem = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("strategy_plans")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setResult({ strategy: data.strategy, planId: data.id });
      setViewingHistory(true);
      setFormData({
        ideaDescription: data.idea_description,
        targetMarket: data.target_market || "",
        budgetConstraints: data.budget_constraints || "",
      });
    } catch {
      toast({ title: "Failed to load strategy", variant: "destructive" });
    }
  };

  const copySection = async (title: string, content: string) => {
    await navigator.clipboard.writeText(`${title}\n\n${content}`);
    setCopiedSection(title);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const copyAll = async () => {
    if (!result?.strategy) return;
    const s = result.strategy;
    const text = formatStrategyAsText(s);
    await navigator.clipboard.writeText(text);
    toast({ title: "Full strategy copied!" });
  };

  const handleExport = () => {
    if (!result?.strategy) return;
    const content = formatStrategyAsText(result.strategy);
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `strategy.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const strategy = result?.strategy;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Strategy Builder</h1>
              <p className="text-muted-foreground">Generate a comprehensive business strategy with AI</p>
            </div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" /> History
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Strategy History</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No strategies yet</p>
                  ) : (
                    history.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => loadHistoryItem(item.id)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">{item.idea_description}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>

      {/* Input Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Describe Your Idea</CardTitle>
            <CardDescription>Provide details about your startup idea and we'll generate a strategic plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="idea">Idea Description *</Label>
              <Textarea
                id="idea"
                placeholder="Describe your startup idea in detail. What problem does it solve? What's your unique approach?"
                value={formData.ideaDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, ideaDescription: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="market">Target Market</Label>
                <Input id="market" placeholder="e.g., College students, SMBs, Healthcare"
                  value={formData.targetMarket}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetMarket: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Constraints</Label>
                <Input id="budget" placeholder="e.g., Bootstrap, $50K seed, $500K Series A"
                  value={formData.budgetConstraints}
                  onChange={(e) => setFormData(prev => ({ ...prev, budgetConstraints: e.target.value }))} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <Button onClick={handleGenerate} disabled={!formData.ideaDescription || isLoading}
              className="w-full gradient-accent text-accent-foreground">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating Strategy...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate Strategy</>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      {strategy && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="h-4 w-4 mr-2" /> Copy All
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>

          {/* Executive Summary */}
          <DetailedSection
            title="Executive Summary"
            content={typeof strategy.executiveSummary === "string" ? strategy.executiveSummary : strategy.executiveSummary?.overview || strategy.executive_summary || ""}
            rationale={strategy.executiveSummary?.rationale}
            detailedExplanation={strategy.executiveSummary?.detailedExplanation}
            keyInsights={strategy.executiveSummary?.keyInsights}
            copiedSection={copiedSection}
            onCopy={copySection}
          />

          {/* Market Analysis */}
          <DetailedSection
            title="Market Analysis"
            content={typeof strategy.marketAnalysis === "string" ? strategy.marketAnalysis : strategy.marketAnalysis?.marketSize || strategy.market_analysis || ""}
            rationale={strategy.marketAnalysis?.rationale}
            detailedExplanation={strategy.marketAnalysis?.detailedExplanation}
            subItems={strategy.marketAnalysis?.targetSegments?.map((s: any) => typeof s === "string" ? s : `${s.segment}: ${s.description} (${s.size})`)}
            trends={strategy.marketAnalysis?.keyTrends?.map((t: any) => typeof t === "string" ? t : `${t.trend} — ${t.impact}`)}
            copiedSection={copiedSection}
            onCopy={copySection}
          />

          {/* Competitive Positioning */}
          <DetailedSection
            title="Competitive Positioning"
            content={strategy.competitivePositioning?.uniqueValueProposition || strategy.competitive_advantage || ""}
            rationale={strategy.competitivePositioning?.rationale}
            detailedExplanation={strategy.competitivePositioning?.detailedExplanation}
            actionableSteps={strategy.competitivePositioning?.actionableSteps}
            competitors={strategy.competitivePositioning?.competitors}
            copiedSection={copiedSection}
            onCopy={copySection}
          />

          {/* Go-to-Market Strategy */}
          <DetailedSection
            title="Go-to-Market Strategy"
            content={typeof strategy.goToMarketStrategy === "string" ? strategy.goToMarketStrategy : strategy.goToMarketStrategy?.launchApproach || strategy.go_to_market || ""}
            rationale={strategy.goToMarketStrategy?.rationale}
            detailedExplanation={strategy.goToMarketStrategy?.detailedExplanation}
            actionableSteps={strategy.goToMarketStrategy?.actionableSteps}
            channels={strategy.goToMarketStrategy?.marketingChannels}
            copiedSection={copiedSection}
            onCopy={copySection}
          />

          {/* Revenue Model */}
          <DetailedSection
            title="Revenue Model"
            content={typeof strategy.revenueModel === "string" ? strategy.revenueModel : strategy.revenueModel?.monetizationStrategy || strategy.revenue_model || ""}
            rationale={strategy.revenueModel?.rationale}
            detailedExplanation={strategy.revenueModel?.detailedExplanation}
            projections={strategy.revenueModel?.projections}
            revenueStreams={strategy.revenueModel?.revenueStreams}
            copiedSection={copiedSection}
            onCopy={copySection}
          />

          {/* Risk Assessment */}
          {strategy.riskAssessment && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-primary" /> Risk Assessment
                </CardTitle>
                <CopyButton section="Risk Assessment" content={JSON.stringify(strategy.riskAssessment, null, 2)} copied={copiedSection} onCopy={copySection} />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(Array.isArray(strategy.riskAssessment) ? strategy.riskAssessment : []).map((risk: any, i: number) => (
                    <Collapsible key={i}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
                        <span className="font-medium text-sm">{risk.risk}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 py-2 space-y-1">
                        <p className="text-sm"><strong>Impact:</strong> {risk.impact}</p>
                        {risk.probability && <p className="text-sm"><strong>Probability:</strong> {risk.probability}</p>}
                        <p className="text-sm"><strong>Mitigation:</strong> {risk.mitigation}</p>
                        {risk.contingencyPlan && <p className="text-sm"><strong>Contingency:</strong> {risk.contingencyPlan}</p>}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 90-Day Action Plan */}
          {strategy.actionPlan && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-primary" /> 90-Day Action Plan
                </CardTitle>
                <CopyButton section="Action Plan" content={JSON.stringify(strategy.actionPlan, null, 2)} copied={copiedSection} onCopy={copySection} />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(Array.isArray(strategy.actionPlan) ? strategy.actionPlan : []).map((week: any, i: number) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
                      <h4 className="font-semibold text-sm mb-2">{week.week}</h4>
                      <p className="text-sm font-medium text-primary mb-2">Milestone: {week.milestone}</p>
                      <ul className="space-y-1">
                        {(week.tasks || []).map((task: string, j: number) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span> {task}
                          </li>
                        ))}
                      </ul>
                      {week.resources && <p className="text-xs text-muted-foreground mt-2">Resources: {week.resources}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resource Requirements */}
          {strategy.resourceRequirements && (
            <DetailedSection
              title="Resource Requirements"
              content={strategy.resourceRequirements?.detailedExplanation || strategy.resource_requirements || ""}
              team={strategy.resourceRequirements?.team}
              budgetBreakdown={strategy.resourceRequirements?.budget}
              copiedSection={copiedSection}
              onCopy={copySection}
            />
          )}

          {/* Fallback for old format */}
          {strategy.risks_and_mitigations && !strategy.riskAssessment && (
            <DetailedSection title="Risks & Mitigations" content={strategy.risks_and_mitigations} copiedSection={copiedSection} onCopy={copySection} />
          )}
          {strategy.milestones && !strategy.actionPlan && (
            <Card>
              <CardHeader><CardTitle>Key Milestones</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strategy.milestones.map((m: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">{i + 1}</span>
                      <span className="text-sm">{m}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}

function CopyButton({ section, content, copied, onCopy }: { section: string; content: string; copied: string | null; onCopy: (s: string, c: string) => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={() => onCopy(section, content)}>
      {copied === section ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function DetailedSection({ title, content, rationale, detailedExplanation, actionableSteps, keyInsights, subItems, trends, competitors, channels, projections, revenueStreams, team, budgetBreakdown, copiedSection, onCopy }: any) {
  const sectionContent = typeof content === "object" ? JSON.stringify(content) : content || "";
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ChevronRight className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
        <CopyButton section={title} content={`${sectionContent}\n\n${rationale || ""}\n\n${detailedExplanation || ""}`} copied={copiedSection} onCopy={onCopy} />
      </CardHeader>
      <CardContent className="space-y-4">
        {sectionContent && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{sectionContent}</ReactMarkdown>
          </div>
        )}

        {keyInsights && keyInsights.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Key Insights</h4>
            <ul className="space-y-1">
              {keyInsights.map((insight: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary mt-1 shrink-0" /> {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {subItems && subItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Target Segments</h4>
            <ul className="space-y-1">
              {subItems.map((item: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-primary">•</span> {item}</li>
              ))}
            </ul>
          </div>
        )}

        {trends && trends.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Key Trends</h4>
            <ul className="space-y-1">
              {trends.map((t: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-primary">📈</span> {t}</li>
              ))}
            </ul>
          </div>
        )}

        {competitors && competitors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Competitors</h4>
            {competitors.map((c: any, i: number) => (
              <Collapsible key={i}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-left text-sm font-medium">
                  {c.name} {c.marketShare && <span className="text-xs text-muted-foreground">{c.marketShare}</span>}
                  <ChevronDown className="h-3 w-3" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-2 py-1 text-xs text-muted-foreground space-y-1">
                  {c.strengths?.length > 0 && <p><strong>Strengths:</strong> {c.strengths.join(", ")}</p>}
                  {c.weaknesses?.length > 0 && <p><strong>Weaknesses:</strong> {c.weaknesses.join(", ")}</p>}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}

        {channels && channels.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Marketing Channels</h4>
            {channels.map((ch: any, i: number) => (
              <div key={i} className="p-2 rounded-lg bg-muted/30 text-sm">
                <p className="font-medium">{typeof ch === "string" ? ch : ch.channel}</p>
                {typeof ch !== "string" && ch.strategy && <p className="text-xs text-muted-foreground mt-1">{ch.strategy}</p>}
                {typeof ch !== "string" && ch.expectedROI && <p className="text-xs text-primary mt-0.5">Expected ROI: {ch.expectedROI}</p>}
              </div>
            ))}
          </div>
        )}

        {projections && (
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(projections).map(([key, val]) => (
              <div key={key} className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground capitalize">{key}</p>
                <p className="font-semibold text-sm mt-1">{val as string}</p>
              </div>
            ))}
          </div>
        )}

        {revenueStreams && revenueStreams.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Revenue Streams</h4>
            {revenueStreams.map((rs: any, i: number) => (
              <div key={i} className="p-2 rounded-lg bg-muted/30 text-sm">
                <p className="font-medium">{rs.stream}</p>
                <p className="text-xs text-muted-foreground">{rs.description}</p>
              </div>
            ))}
          </div>
        )}

        {team && team.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Team Requirements</h4>
            {team.map((t: any, i: number) => (
              <div key={i} className="p-2 rounded-lg bg-muted/30 text-sm">
                <p className="font-medium">{t.role} <span className="text-xs text-primary">({t.priority})</span></p>
                <p className="text-xs text-muted-foreground">{t.responsibility}</p>
              </div>
            ))}
          </div>
        )}

        {budgetBreakdown && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Budget: {budgetBreakdown.total}</h4>
            {budgetBreakdown.breakdown?.map((b: any, i: number) => (
              <div key={i} className="flex justify-between text-sm px-2">
                <span className="text-muted-foreground">{b.category}</span>
                <span className="font-medium">{b.amount}</span>
              </div>
            ))}
          </div>
        )}

        {actionableSteps && actionableSteps.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <ChevronDown className="h-4 w-4" /> Actionable Steps
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {actionableSteps.map((step: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground p-2 rounded bg-primary/5">
                  <span className="font-medium text-primary shrink-0">{i + 1}.</span> {step}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {rationale && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <ChevronDown className="h-4 w-4" /> Why This Approach?
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm text-muted-foreground">{rationale}</p>
            </CollapsibleContent>
          </Collapsible>
        )}

        {detailedExplanation && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <ChevronDown className="h-4 w-4" /> Detailed Analysis
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 prose prose-sm dark:prose-invert max-w-none p-3 rounded-lg bg-muted/30">
              <ReactMarkdown>{detailedExplanation}</ReactMarkdown>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

function formatStrategyAsText(s: any): string {
  const sections: string[] = [];
  const add = (title: string, val: any) => {
    if (!val) return;
    if (typeof val === "string") sections.push(`## ${title}\n${val}`);
    else if (val.overview) sections.push(`## ${title}\n${val.overview}`);
  };
  
  add("Executive Summary", s.executiveSummary || s.executive_summary);
  add("Market Analysis", s.marketAnalysis || s.market_analysis);
  add("Competitive Positioning", s.competitivePositioning || s.competitive_advantage);
  add("Go-to-Market Strategy", s.goToMarketStrategy || s.go_to_market);
  add("Revenue Model", s.revenueModel || s.revenue_model);
  
  if (s.riskAssessment) {
    sections.push("## Risk Assessment\n" + s.riskAssessment.map((r: any) => `- ${r.risk}: ${r.mitigation}`).join("\n"));
  }
  if (s.actionPlan) {
    sections.push("## 90-Day Action Plan\n" + s.actionPlan.map((w: any) => `### ${w.week}\n${w.tasks?.join("\n- ")}`).join("\n\n"));
  }
  
  return sections.join("\n\n");
}
