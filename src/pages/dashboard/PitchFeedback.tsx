import { useState } from "react";
import { motion } from "framer-motion";
import { Presentation, Loader2, Sparkles, ThumbsUp, AlertTriangle, Target, TrendingUp, AlertCircle, Copy, Check, History, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePitchFeedback, usePitchHistory } from "@/hooks/useAIChat";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";

interface FeedbackResult {
  feedback: {
    overall_assessment: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    clarity_score: number;
    persuasiveness_score: number;
    market_fit_score: number;
    investor_readiness: string;
  };
}

const fundingStages = [
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B+" },
];

const audiences = [
  { value: "angel", label: "Angel Investors" },
  { value: "vc", label: "Venture Capitalists" },
  { value: "accelerator", label: "Accelerator/Incubator" },
  { value: "corporate", label: "Corporate Investors" },
];

export default function PitchFeedback() {
  const { toast } = useToast();
  const { analyzePitch, regeneratePitch, isLoading } = usePitchFeedback();
  const { data: history = [], refetch: refetchHistory } = usePitchHistory();
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [regeneratedPitch, setRegeneratedPitch] = useState<any>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    pitchContent: "",
    targetAudience: "",
    fundingStage: "",
  });

  const handleAnalyze = async () => {
    if (!formData.pitchContent) {
      toast({ title: "Please enter your pitch", variant: "destructive" });
      return;
    }

    setError(null);
    setRegeneratedPitch(null);
    try {
      const data = await analyzePitch({
        pitchContent: formData.pitchContent,
        targetAudience: formData.targetAudience || undefined,
        fundingStage: formData.fundingStage || undefined,
      });

      const normalizedResult: FeedbackResult = {
        feedback: {
          overall_assessment: data?.feedback?.overall_assessment || data?.feedback?.overallAssessment || "No assessment generated yet.",
          strengths: Array.isArray(data?.feedback?.strengths) ? data.feedback.strengths : [],
          weaknesses: Array.isArray(data?.feedback?.weaknesses) ? data.feedback.weaknesses : [],
          suggestions: Array.isArray(data?.feedback?.suggestions) ? data.feedback.suggestions : Array.isArray(data?.feedback?.priorityActions) ? data.feedback.priorityActions : [],
          clarity_score: typeof data?.feedback?.clarity_score === "number" ? data.feedback.clarity_score : (data?.feedback?.clarityScore || 0),
          persuasiveness_score: typeof data?.feedback?.persuasiveness_score === "number" ? data.feedback.persuasiveness_score : (data?.feedback?.persuasivenessScore || 0),
          market_fit_score: typeof data?.feedback?.market_fit_score === "number" ? data.feedback.market_fit_score : 0,
          investor_readiness: data?.feedback?.investor_readiness || data?.feedback?.investorReadiness || "Not available",
        },
      };

      setResult(normalizedResult);
      refetchHistory();
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        setError("AI features are temporarily unavailable due to high demand. Please try again in a few minutes.");
      } else {
        setError(err.message || "Failed to analyze pitch. Please try again.");
      }
    }
  };

  const handleRegenerate = async () => {
    if (!result || !formData.pitchContent) return;
    setIsRegenerating(true);
    try {
      const data = await regeneratePitch({
        originalPitch: formData.pitchContent,
        feedback: result.feedback,
        targetAudience: formData.targetAudience || undefined,
        fundingStage: formData.fundingStage || undefined,
      });
      setRegeneratedPitch(data);
      toast({ title: "Improved pitch generated!" });
    } catch (err: any) {
      toast({ title: "Failed to regenerate", description: err.message, variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const loadHistoryItem = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("pitch_feedback")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      
      const fb = data.feedback as any;
      setFormData({
        pitchContent: data.pitch_content,
        targetAudience: data.target_audience || "",
        fundingStage: data.funding_stage || "",
      });
      setResult({
        feedback: {
          overall_assessment: fb?.overall_assessment || fb?.overallAssessment || "",
          strengths: fb?.strengths || [],
          weaknesses: fb?.weaknesses || [],
          suggestions: fb?.suggestions || fb?.priorityActions || [],
          clarity_score: fb?.clarity_score || fb?.clarityScore || data.clarity_score || 0,
          persuasiveness_score: fb?.persuasiveness_score || fb?.persuasivenessScore || data.persuasiveness_score || 0,
          market_fit_score: fb?.market_fit_score || 0,
          investor_readiness: fb?.investor_readiness || fb?.investorReadiness || "N/A",
        },
      });
      setRegeneratedPitch(null);
    } catch {
      toast({ title: "Failed to load feedback", variant: "destructive" });
    }
  };

  const copyToClipboard = async (section: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedSection(section);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const copyAllFeedback = async () => {
    if (!result) return;
    const fb = result.feedback;
    const text = `Pitch Feedback Analysis

Scores:
- Clarity: ${fb.clarity_score}/100
- Persuasiveness: ${fb.persuasiveness_score}/100
- Market Fit: ${fb.market_fit_score}/100

Overall Assessment:
${fb.overall_assessment}

Investor Readiness: ${fb.investor_readiness}

Strengths:
${fb.strengths.map(s => `✓ ${s}`).join("\n")}

Areas to Improve:
${fb.weaknesses.map(w => `! ${w}`).join("\n")}

Suggestions:
${fb.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
    
    await navigator.clipboard.writeText(text);
    toast({ title: "All feedback copied!" });
  };

  const CopyBtn = ({ section, content }: { section: string; content: string }) => (
    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(section, content)}>
      {copiedSection === section ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Presentation className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pitch Feedback</h1>
              <p className="text-muted-foreground">Get AI-powered analysis of your investor pitch</p>
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
                <SheetTitle>Pitch History</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No feedback yet</p>
                  ) : (
                    history.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => loadHistoryItem(item.id)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <p className="text-sm truncate">{item.pitch_content?.substring(0, 80)}...</p>
                        <div className="flex items-center gap-2 mt-2">
                          {item.clarity_score && <Badge variant="outline" className="text-xs">Clarity: {item.clarity_score}</Badge>}
                          {item.persuasiveness_score && <Badge variant="outline" className="text-xs">Persuasive: {item.persuasiveness_score}</Badge>}
                        </div>
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
            <CardTitle>Enter Your Pitch</CardTitle>
            <CardDescription>Paste your pitch script or key talking points for comprehensive feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pitch">Pitch Content *</Label>
              <Textarea
                id="pitch"
                placeholder="Paste your pitch here... Include your problem statement, solution, market size, traction, team, and ask."
                value={formData.pitchContent}
                onChange={(e) => setFormData(prev => ({ ...prev, pitchContent: e.target.value }))}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">{formData.pitchContent.length} characters</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={formData.targetAudience} onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger>
                  <SelectContent>
                    {audiences.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Funding Stage</Label>
                <Select value={formData.fundingStage} onValueChange={(value) => setFormData(prev => ({ ...prev, fundingStage: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    {fundingStages.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <Button onClick={handleAnalyze} disabled={!formData.pitchContent || isLoading}
              className="w-full gradient-accent text-accent-foreground">
              {isLoading && !isRegenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing Pitch...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Analyze My Pitch</>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Copy All + Regenerate */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={copyAllFeedback}>
              <Copy className="h-4 w-4 mr-2" /> Copy All
            </Button>
            <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Regenerating...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Regenerate Pitch</>
              )}
            </Button>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ScoreCard title="Clarity" score={result.feedback.clarity_score} icon={Target} />
            <ScoreCard title="Persuasiveness" score={result.feedback.persuasiveness_score} icon={TrendingUp} />
            <ScoreCard title="Market Fit" score={result.feedback.market_fit_score} icon={Sparkles} />
          </div>

          {/* Overall Assessment */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Presentation className="h-5 w-5 text-primary" /> Overall Assessment
              </CardTitle>
              <CopyBtn section="assessment" content={result.feedback.overall_assessment} />
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{result.feedback.overall_assessment}</ReactMarkdown>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium">Investor Readiness</p>
                <p className="text-sm text-muted-foreground mt-1">{result.feedback.investor_readiness}</p>
              </div>
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <ThumbsUp className="h-5 w-5" /> Strengths
                </CardTitle>
                <CopyBtn section="strengths" content={result.feedback.strengths.join("\n")} />
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.feedback.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span> {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" /> Areas to Improve
                </CardTitle>
                <CopyBtn section="weaknesses" content={result.feedback.weaknesses.join("\n")} />
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.feedback.weaknesses.map((weakness, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-500 mt-0.5">!</span> {weakness}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Suggestions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Actionable Suggestions
              </CardTitle>
              <CopyBtn section="suggestions" content={result.feedback.suggestions.join("\n")} />
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {result.feedback.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Badge className="shrink-0">{i + 1}</Badge>
                    <span className="text-sm">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Regenerated Pitch */}
          {regeneratedPitch && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-primary" /> Improved Pitch
                  </CardTitle>
                  <CopyBtn section="regenerated" content={regeneratedPitch.improvedPitch || ""} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <ReactMarkdown>{regeneratedPitch.improvedPitch}</ReactMarkdown>
                  </div>
                  
                  {regeneratedPitch.changesHighlighted?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Key Changes Made</h4>
                      <ul className="space-y-1">
                        {regeneratedPitch.changesHighlighted.map((c: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">→</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {regeneratedPitch.tips?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Delivery Tips</h4>
                      <ul className="space-y-1">
                        {regeneratedPitch.tips.map((t: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">💡</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button onClick={() => {
                    setFormData(prev => ({ ...prev, pitchContent: regeneratedPitch.improvedPitch }));
                    toast({ title: "Improved pitch loaded into editor!" });
                  }} variant="outline" className="w-full">
                    Use This Pitch
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function ScoreCard({ title, score, icon: Icon }: { title: string; score: number; icon: React.ElementType }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{title}</span>
          </div>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
        <Progress value={score} className="h-2" />
      </CardContent>
    </Card>
  );
}
