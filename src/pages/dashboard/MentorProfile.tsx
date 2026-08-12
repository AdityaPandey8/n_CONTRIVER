import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ArrowLeft, MessageSquare, Star, MapPin, Briefcase, CheckCircle, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMentors } from "@/hooks/useMentors";
import { useMentorStories } from "@/hooks/useMentorStories";
import { useNavigateToMessage } from "@/hooks/useNavigateToMessage";
import { ConnectButton } from "@/components/connections/ConnectButton";
import { formatDistanceToNow } from "date-fns";

export default function MentorProfile() {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { mentors, isLoading } = useMentors();
  const { stories } = useMentorStories();
  const { navigateToMessage } = useNavigateToMessage();

  const mentor = mentors.find(m => m.id === mentorId);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (!mentor) {
    return (
      <div className="text-center py-20">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Mentor not found</h2>
        <Button variant="link" onClick={() => navigate("/dashboard/mentors")}>Back to Mentors</Button>
      </div>
    );
  }

  const mentorStories = stories.filter(s => s.mentor_id === mentor.id);
  const isTopMentor = (mentor.rating || 0) >= 4.5 && (mentor.total_reviews || 0) >= 5;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/mentors")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Mentors
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Avatar className="h-20 w-20 ring-2 ring-primary/10">
                <AvatarImage src={mentor.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-2xl">
                  {mentor.profile?.full_name?.split(" ").map((n: string) => n[0]).join("") || "M"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{mentor.profile?.full_name || "Mentor"}</h1>
                  {mentor.is_verified && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {isTopMentor && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1"><Star className="h-3 w-3 fill-current" /> Top Mentor</Badge>}
                </div>
                <p className="text-muted-foreground">{mentor.profile?.headline || "Industry Expert"}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {mentor.profile?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{mentor.profile.location}</span>}
                  {mentor.years_experience && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{mentor.years_experience} years</span>}
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{mentor.rating || "New"} ({mentor.total_reviews || 0} reviews)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={() => navigateToMessage(mentor.user_id)} className="gap-2"><MessageSquare className="h-4 w-4" /> Message</Button>
              <Button variant="outline" className="gap-2" disabled={mentor.availability === "unavailable"}>
                <Calendar className="h-4 w-4" /> {mentor.availability !== "unavailable" ? "Book Session" : "Unavailable"}
              </Button>
              <ConnectButton targetUserId={mentor.user_id} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {mentor.bio && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card><CardHeader><CardTitle>About</CardTitle></CardHeader><CardContent><p className="text-muted-foreground leading-relaxed">{mentor.bio}</p></CardContent></Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader><CardTitle>Expertise</CardTitle></CardHeader>
          <CardContent><div className="flex flex-wrap gap-2">{mentor.expertise?.map((e: string) => <Badge key={e} variant="secondary">{e}</Badge>)}</div></CardContent>
        </Card>
      </motion.div>

      {mentorStories.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle>Stories ({mentorStories.length})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {mentorStories.slice(0, 3).map(story => (
                <div key={story.id} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="capitalize">{story.story_type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(story.created_at!), { addSuffix: true })}</span>
                  </div>
                  <h4 className="font-medium">{story.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{story.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
