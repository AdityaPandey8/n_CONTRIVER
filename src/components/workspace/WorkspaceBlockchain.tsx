import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Copy, Check, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IdeaWorkspace } from "@/hooks/useIdeaWorkspace";

interface Props {
  workspace: IdeaWorkspace;
  details: Record<string, any>;
}

export function WorkspaceBlockchain({ workspace, details }: Props) {
  const { toast } = useToast();
  const [proof, setProof] = useState<{ hash: string; timestamp: string; data: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateProof = async () => {
    setGenerating(true);
    const timestamp = new Date().toISOString();
    const data = JSON.stringify({
      idea_name: workspace.idea_name,
      one_liner: workspace.one_liner,
      domain: workspace.domain,
      details: Object.keys(details),
      timestamp,
    });

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    setProof({ hash, timestamp, data });
    setGenerating(false);
  };

  const copyHash = () => {
    if (proof) {
      navigator.clipboard.writeText(proof.hash);
      setCopied(true);
      toast({ title: "Hash copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Idea Proof of Existence</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Simulated Blockchain Timestamp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a cryptographic hash (SHA-256) of your idea data to prove it existed at a specific time.
            This is a simulated proof — for legal protection, use a real timestamping service.
          </p>

          {!proof ? (
            <Button onClick={generateProof} disabled={generating} className="gap-2">
              <Shield className="h-4 w-4" />
              {generating ? "Generating..." : "Generate Proof"}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Timestamp</span>
                  <Badge variant="secondary" className="text-xs">{new Date(proof.timestamp).toLocaleString()}</Badge>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">SHA-256 Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-background p-2 rounded border flex-1 break-all">
                      {proof.hash}
                    </code>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={copyHash}>
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Hashed Data</p>
                  <code className="text-xs font-mono bg-background p-2 rounded border block break-all">
                    {proof.data}
                  </code>
                </div>
              </div>

              <Button variant="outline" onClick={generateProof} className="gap-2">
                <Shield className="h-4 w-4" />
                Regenerate Proof
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
