import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ArrowLeft, MessageSquare, Briefcase, Star, MapPin, DollarSign, ExternalLink, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTalents } from "@/hooks/useTalents";
import { useNavigateToMessage } from "@/hooks/useNavigateToMessage";
import { ConnectButton } from "@/components/connections/ConnectButton";

export default function TalentProfile() {
  const { talentId } = useParams();
  const navigate = useNavigate();
  const { talents, isLoading } = useTalents({});
  const { navigateToMessage } = useNavigateToMessage();

  const talent = talents.find(t => t.id === talentId);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (!talent) {
    return (
      <div className="text-center py-20">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Talent not found</h2>
        <Button variant="link" onClick={() => navigate("/dashboard/talents")}>Back to Talents</Button>
      </div>
    );
  }

  const getAvailabilityColor = (a: string) => {
    if (a === "available") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (a === "open") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/talents")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Talents
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={talent.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {(talent.profile?.full_name || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{talent.profile?.full_name || "Anonymous"}</h1>
                  {talent.is_featured && <Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
                </div>
                <p className="text-muted-foreground">{talent.title}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getAvailabilityColor(talent.availability)}>
                    {talent.availability === "available" ? "Available Now" : "Open to Work"}
                  </Badge>
                  {talent.profile?.location && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{talent.profile.location}</span>
                  )}
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" />{talent.experience_years || 0} years</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={() => navigateToMessage(talent.user_id)} className="gap-2"><MessageSquare className="h-4 w-4" /> Message</Button>
              <ConnectButton targetUserId={talent.user_id} />
              {talent.portfolio_url && (
                <Button variant="outline" asChild className="gap-2"><a href={talent.portfolio_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Portfolio</a></Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {talent.bio && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card><CardHeader><CardTitle>About</CardTitle></CardHeader><CardContent><p className="text-muted-foreground leading-relaxed">{talent.bio}</p></CardContent></Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
          <CardContent><div className="flex flex-wrap gap-2">{talent.skills.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div></CardContent>
        </Card>
      </motion.div>

      {(talent.expected_salary_min || talent.expected_salary_max) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle>Salary Expectation</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                ${talent.expected_salary_min?.toLocaleString() || "0"} – ${talent.expected_salary_max?.toLocaleString() || "Negotiable"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
