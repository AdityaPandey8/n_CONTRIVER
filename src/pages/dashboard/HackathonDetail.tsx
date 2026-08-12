import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Calendar, MapPin, Users, DollarSign, Clock, ArrowLeft, MessageSquare, Bookmark, Share2, CheckCircle, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useHackathons } from "@/hooks/useHackathons";
import { useNavigateToMessage } from "@/hooks/useNavigateToMessage";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const getStatusColor = (status: string) => {
  switch (status) {
    case "upcoming": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "live": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-pulse";
    case "completed": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function HackathonDetail() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hackathons, isLoading, registerForHackathon } = useHackathons();
  const { navigateToMessage } = useNavigateToMessage();

  const hackathon = hackathons.find(h => h.id === hackathonId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="text-center py-20">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Hackathon not found</h2>
        <Button variant="link" onClick={() => navigate("/dashboard/hackathons")}>Back to Hackathons</Button>
      </div>
    );
  }

  const isTrending = (hackathon.registrations_count || 0) > 50;
  const fillPercent = hackathon.max_participants ? ((hackathon.registrations_count || 0) / hackathon.max_participants) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/hackathons")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Hackathons
      </Button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getStatusColor(hackathon.status)}>
                {hackathon.status === "live" && "🔴 "}{hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
              </Badge>
              {isTrending && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
                  <TrendingUp className="h-3 w-3" /> Trending
                </Badge>
              )}
              {hackathon.prize && (
                <Badge variant="outline" className="gap-1"><DollarSign className="h-3 w-3" />{hackathon.prize}</Badge>
              )}
              {!hackathon.is_verified && (
                <Badge variant="outline" className="text-amber-500 border-amber-500">Pending Verification</Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold text-foreground">{hackathon.title}</h1>
            <p className="text-muted-foreground">Organized by <span className="text-foreground font-medium">{hackathon.organizer}</span></p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{format(new Date(hackathon.start_date), "MMM d, yyyy")} – {format(new Date(hackathon.end_date), "MMM d, yyyy")}</div>
              {hackathon.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{hackathon.location}</div>}
              {hackathon.registration_deadline && <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />Deadline: {format(new Date(hackathon.registration_deadline), "MMM d, yyyy")}</div>}
              {hackathon.max_participants && <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />{hackathon.registrations_count || 0} / {hackathon.max_participants} participants</div>}
            </div>

            {hackathon.max_participants && <Progress value={fillPercent} className="h-2" />}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              {hackathon.status === "upcoming" && !hackathon.is_registered && (
                <Button className="gradient-primary text-primary-foreground" onClick={() => registerForHackathon.mutateAsync({ hackathonId: hackathon.id })} disabled={!user}>
                  Apply Now
                </Button>
              )}
              {hackathon.is_registered && (
                <Button variant="outline" disabled><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Registered</Button>
              )}
              <Button variant="outline" size="icon"><Bookmark className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Description */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader><CardTitle>About This Hackathon</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{hackathon.description}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tags */}
      {hackathon.tags && hackathon.tags.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader><CardTitle>Topics & Tags</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {hackathon.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Timeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hackathon.registration_deadline && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div><p className="font-medium text-sm">Registration Deadline</p><p className="text-sm text-muted-foreground">{format(new Date(hackathon.registration_deadline), "MMMM d, yyyy")}</p></div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div><p className="font-medium text-sm">Start Date</p><p className="text-sm text-muted-foreground">{format(new Date(hackathon.start_date), "MMMM d, yyyy")}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                <div><p className="font-medium text-sm">End Date</p><p className="text-sm text-muted-foreground">{format(new Date(hackathon.end_date), "MMMM d, yyyy")}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Prizes */}
      {hackathon.prize && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Prizes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{hackathon.prize}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
