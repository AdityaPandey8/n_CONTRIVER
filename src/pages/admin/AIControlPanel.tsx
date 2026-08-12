import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Loader2, Zap, Database, Clock, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAISettings } from "@/hooks/useAISettings";
import { useAIUsage } from "@/hooks/useAIUsage";

export default function AIControlPanel() {
  const { settings, isLoading, update } = useAISettings();
  const usage = useAIUsage(1);
  const [weights, setWeights] = useState({ demand: 40, feasibility: 30, innovation: 20, scalability: 10 });
  const [modules, setModules] = useState({ validation: true, strategy: true, chat: true, match: true });

  useEffect(() => {
    if (settings) {
      setWeights(settings.validation_weights);
      setModules(settings.modules_enabled);
    }
  }, [settings]);

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const cards = [
    { label: "Requests (24h)", value: usage.data?.total ?? 0, icon: Zap, color: "from-primary/20 to-primary/10" },
    { label: "Cache hit rate", value: `${usage.data?.cacheHitRate ?? 0}%`, icon: Database, color: "from-success/20 to-success/10" },
    { label: "Tokens used", value: (usage.data?.totalTokens ?? 0).toLocaleString(), icon: Brain, color: "from-accent/20 to-accent/10" },
    { label: "Avg latency", value: `${usage.data?.avgLatency ?? 0} ms`, icon: Clock, color: "from-warning/20 to-warning/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          AI Control Panel
        </h1>
        <p className="text-muted-foreground mt-1">Tune validation weights, toggle modules, and monitor AI usage</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${c.color}`}>
                  <c.icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Validation Weights</CardTitle>
            <CardDescription>How idea scores are computed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {(Object.keys(weights) as Array<keyof typeof weights>).map((k) => (
              <div key={k} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize text-foreground">{k}</span>
                  <span className="text-muted-foreground">{weights[k]}%</span>
                </div>
                <Slider value={[weights[k]]} onValueChange={([v]) => setWeights({ ...weights, [k]: v })} max={100} step={5} />
              </div>
            ))}
            <Button onClick={() => update.mutate({ validation_weights: weights })} disabled={update.isPending} className="w-full mt-2">
              <Save className="h-4 w-4 mr-2" />Save weights
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>AI Modules</CardTitle>
            <CardDescription>Enable or disable platform AI features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(modules) as Array<keyof typeof modules>).map((k) => (
              <div key={k} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <p className="text-sm font-medium capitalize text-foreground">{k}</p>
                  <p className="text-xs text-muted-foreground">Toggle module availability</p>
                </div>
                <Switch checked={modules[k]} onCheckedChange={(v) => setModules({ ...modules, [k]: v })} />
              </div>
            ))}
            <Button onClick={() => update.mutate({ modules_enabled: modules })} disabled={update.isPending} variant="outline" className="w-full mt-2">
              <Save className="h-4 w-4 mr-2" />Save modules
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}