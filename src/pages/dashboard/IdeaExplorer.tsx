import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Brain, Users, TrendingUp, Sword, Lightbulb, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useIdeaWorkspaces } from "@/hooks/useIdeaWorkspace";

interface InsightSection {
  title: string;
  icon: React.ElementType;
  items: string[];
}

export default function IdeaExplorer() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createWorkspace } = useIdeaWorkspaces();
  const [input, setInput] = useState("");
  const [isExploring, setIsExploring] = useState(false);
  const [insights, setInsights] = useState<InsightSection[] | null>(null);
  const [directions, setDirections] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const explore = async () => {
    if (!input.trim()) return;
    setIsExploring(true);
    setInsights(null);
    setDirections([]);
    try {
      const { data, error } = await supabase.functions.invoke("idea-explorer", {
        body: { idea: input.trim() },
      });
      if (error) throw error;

      const sections: InsightSection[] = [
        { title: "Problem Space", icon: Brain, items: data.problem_space || [] },
        { title: "Target Audience Options", icon: Users, items: data.target_audiences || [] },
        { title: "Market Opportunities", icon: TrendingUp, items: data.market_opportunities || [] },
        { title: "Competitor Landscape", icon: Sword, items: data.competitor_landscape || [] },
        { title: "Business Possibilities", icon: Lightbulb, items: data.business_possibilities || [] },
      ];
      setInsights(sections);
      setDirections(data.directions || []);
    } catch (e: any) {
      toast({ title: "Exploration failed", description: e.message, variant: "destructive" });
    } finally {
      setIsExploring(false);
    }
  };

  const convertToWorkspace = async (direction?: any) => {
    const name = direction?.title || input.trim().slice(0, 100);
    const result = await createWorkspace.mutateAsync({
      idea_name: name,
      one_liner: direction?.description || input.trim(),
      domain: "General",
    });
    navigate(`/dashboard/workspace/${result.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Idea Explorer</h1>
        <p className="text-muted-foreground mt-1">
          Explore and expand your idea before building. Get AI-powered structured insights.
        </p>
      </div>

      {/* Input */}
      <Card className="bg-card/80 border-border/50">
        <CardContent className="pt-6 space-y-4">
          <Textarea
            placeholder="Describe your idea... e.g. 'An app that helps students find affordable housing near universities'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="bg-background text-base"
          />
          <div className="flex items-center gap-3">
            <Button onClick={explore} disabled={!input.trim() || isExploring} className="gradient-accent text-accent-foreground">
              {isExploring ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Exploring...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Explore Idea</>
              )}
            </Button>
            <div className="text-sm text-muted-foreground space-x-4">
              <span>💭 Who suffers most?</span>
              <span>🤔 Why unsolved?</span>
              <span>⚡ What makes this 10x better?</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {insights.map((section, i) => {
              const Icon = section.icon;
              const isExpanded = expanded[i] !== false;
              return (
                <Card key={i} className="bg-card/80 border-border/50">
                  <CardHeader
                    className="cursor-pointer flex flex-row items-center justify-between"
                    onClick={() => setExpanded(p => ({ ...p, [i]: !isExpanded }))}
                  >
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {section.title}
                      <Badge variant="secondary" className="ml-2">{section.items.length}</Badge>
                    </CardTitle>
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardHeader>
                  {isExpanded && (
                    <CardContent>
                      <ul className="space-y-2">
                        {section.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {/* Directions */}
            {directions.length > 0 && (
              <Card className="bg-card/80 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-accent" />
                    Possible Directions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {directions.map((dir, i) => (
                    <div key={i} className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold">{dir.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{dir.description}</p>
                        </div>
                        <Button size="sm" onClick={() => convertToWorkspace(dir)}>
                          Build This
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Convert to workspace */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => convertToWorkspace()}>
                <Lightbulb className="h-4 w-4 mr-2" />
                Save as Draft & Open Workspace
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
