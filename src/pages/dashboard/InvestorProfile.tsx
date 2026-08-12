import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, DollarSign, Building2, Globe, MessageSquare, Send } from "lucide-react";
import { useInvestors, usePitchShares } from "@/hooks/useInvestors";
import { useIdeaWorkspaces } from "@/hooks/useIdeaWorkspace";
import { usePitchDeck } from "@/hooks/usePitchDeck";
import { PitchShareModal } from "@/components/investor/PitchShareModal";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function InvestorProfile() {
  const { investorId } = useParams<{ investorId: string }>();
  const navigate = useNavigate();
  const { investors, isLoading } = useInvestors();
  const { user } = useAuth();
  const { toast } = useToast();
  const investor = investors.find(i => i.id === investorId);

  const { workspaces } = useIdeaWorkspaces();
  const activeWorkspace = workspaces[0];
  const { pitchDecks } = usePitchDeck(activeWorkspace?.id);
  const { sharePitch } = usePitchShares(activeWorkspace?.id);
  const [showShareModal, setShowShareModal] = useState(false);

  const formatAmount = (n: number | null) => {
    if (!n) return "N/A";
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  const handleMessage = async () => {
    if (!user || !investor) return;
    try {
      // Create conversation & add participants
      const { data: convo, error: ce } = await supabase.from("conversations").insert({}).select("id").single();
      if (ce) throw ce;
      await supabase.from("conversation_participants").insert([
        { conversation_id: convo.id, user_id: user.id },
        // If investor has a user_id, add them; otherwise just navigate
        ...(investor.user_id ? [{ conversation_id: convo.id, user_id: investor.user_id }] : []),
      ]);
      navigate("/dashboard/messages");
    } catch {
      toast({ title: "Could not start conversation", variant: "destructive" });
    }
  };

  const handleSharePitch = (data: { investor_id: string; pitch_deck_id?: string; message?: string }) => {
    sharePitch.mutate(data, { onSuccess: () => setShowShareModal(false) });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!investor) {
    return <div className="text-center py-12 text-muted-foreground">Investor not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-premium">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {investor.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{investor.name}</h1>
                {investor.firm && (
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <Building2 className="h-4 w-4" /> {investor.firm}
                  </p>
                )}
                {investor.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5" /> {investor.location}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <Button onClick={() => setShowShareModal(true)} className="gap-2 gradient-accent text-accent-foreground">
                    <Send className="h-4 w-4" /> Send Pitch
                  </Button>
                  {investor.user_id && (
                    <Button variant="outline" onClick={handleMessage} className="gap-2">
                      <MessageSquare className="h-4 w-4" /> Message
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        {investor.bio && (
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{investor.bio}</p></CardContent>
          </Card>
        )}

        {/* Investment Details */}
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Ticket Size</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {formatAmount(investor.ticket_size_min)} – {formatAmount(investor.ticket_size_max)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Stage Preference</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {investor.stage_preference.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Focus Domains */}
        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Focus Domains</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {investor.focus_domains.map(d => <Badge key={d} variant="outline">{d}</Badge>)}
            </div>
          </CardContent>
        </Card>

        {/* Past Investments */}
        {investor.past_investments.length > 0 && (
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Past Investments</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {investor.past_investments.map((inv: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">{inv.company || inv.name || `Investment ${i + 1}`}</span>
                    {inv.amount && <span className="text-xs text-muted-foreground">{inv.amount}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {investor && (
        <PitchShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          investor={investor}
          pitchDecks={pitchDecks}
          onShare={handleSharePitch}
          isSharing={sharePitch.isPending}
        />
      )}
    </div>
  );
}
