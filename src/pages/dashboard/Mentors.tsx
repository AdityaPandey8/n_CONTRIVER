import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Star, MapPin, Briefcase, Filter, Search, Calendar, CheckCircle, Loader2, GraduationCap, Plus, BookOpen, Heart, MessageCircle, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMentors } from "@/hooks/useMentors";
import { useMentorStories } from "@/hooks/useMentorStories";
import { useAuth } from "@/contexts/AuthContext";
import { ConnectButton } from "@/components/connections/ConnectButton";
import { formatDistanceToNow } from "date-fns";

const expertiseAreas = ["All", "Technology", "Business", "Marketing", "Finance", "Product"];
const expertiseOptions = [
  "AI/ML", "System Design", "Leadership", "Business Strategy", "Fundraising", 
  "Go-to-Market", "Product Management", "UX Strategy", "Growth Marketing", 
  "Content Strategy", "Venture Capital", "Technical Architecture"
];

export default function Mentors() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { mentors, isLoading, applyAsMentor, myMentorProfile, myApplication } = useMentors();
  const { stories, isLoading: storiesLoading, createStory } = useMentorStories();
  const userMentor = myMentorProfile;
  const userApplication = myApplication;
  const [activeTab, setActiveTab] = useState("mentors");
  const [activeExpertise, setActiveExpertise] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [application, setApplication] = useState({
    bio: "",
    motivation: "",
    years_experience: "",
    linkedin_url: "",
    expertise_areas: [] as string[],
  });

  const [newStory, setNewStory] = useState({
    title: "",
    content: "",
    story_type: "success" as "success" | "failure" | "learning",
  });

  const filteredMentors = mentors.filter((mentor) => {
    const matchesExpertise = activeExpertise === "All" || 
      mentor.expertise?.some((exp: string) => 
        exp.toLowerCase().includes(activeExpertise.toLowerCase()) ||
        (activeExpertise === "Technology" && ["AI/ML", "System Design", "Technical Architecture"].includes(exp)) ||
        (activeExpertise === "Business" && ["Business Strategy", "Fundraising", "Go-to-Market"].includes(exp)) ||
        (activeExpertise === "Marketing" && ["Growth Marketing", "Content Strategy", "Brand Building"].includes(exp)) ||
        (activeExpertise === "Finance" && ["Venture Capital", "Due Diligence", "Portfolio Strategy"].includes(exp)) ||
        (activeExpertise === "Product" && ["Product Management", "UX Strategy", "Productivity"].includes(exp))
      );
    const matchesSearch = 
      mentor.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise?.some((exp: string) => exp.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesExpertise && matchesSearch;
  });

  const handleApply = async () => {
    if (!application.bio || !application.motivation || application.expertise_areas.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await applyAsMentor.mutateAsync({
        bio: application.bio,
        motivation: application.motivation,
        years_experience: Number(application.years_experience) || 0,
        linkedin_url: application.linkedin_url || undefined,
        expertise_areas: application.expertise_areas,
      });
      setShowApplyModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateStory = async () => {
    if (!newStory.title || !newStory.content || !userMentor) return;
    
    setIsSubmitting(true);
    try {
      await createStory.mutateAsync({
        mentor_id: userMentor.id,
        title: newStory.title,
        content: newStory.content,
        story_type: newStory.story_type,
      });
      setShowStoryModal(false);
      setNewStory({ title: "", content: "", story_type: "success" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStoryIcon = (type: string) => {
    switch (type) {
      case "success": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "failure": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "learning": return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getStoryColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "failure": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "learning": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default: return "bg-muted";
    }
  };

  const toggleExpertise = (exp: string) => {
    setApplication(prev => ({
      ...prev,
      expertise_areas: prev.expertise_areas.includes(exp)
        ? prev.expertise_areas.filter(e => e !== exp)
        : [...prev.expertise_areas, exp]
    }));
  };

  const getApplicationStatus = () => {
    if (userMentor) return { text: "You are a Mentor", color: "bg-green-500/10 text-green-600" };
    if (userApplication?.status === "pending") return { text: "Application Pending", color: "bg-amber-500/10 text-amber-600" };
    if (userApplication?.status === "rejected") return { text: "Application Rejected", color: "bg-red-500/10 text-red-600" };
    return null;
  };

  const appStatus = getApplicationStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Mentors
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with industry experts to accelerate your growth
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userMentor && (
            <Button 
              onClick={() => setShowStoryModal(true)}
              variant="outline"
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Share Story
            </Button>
          )}
          {user && (
            appStatus ? (
              <Badge className={`${appStatus.color} py-2 px-4`}>
                <GraduationCap className="h-4 w-4 mr-2" />
                {appStatus.text}
            </Badge>
          ) : (
            <Button 
              onClick={() => setShowApplyModal(true)}
              className="gradient-accent text-accent-foreground shadow-glow"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Become a Mentor
              </Button>
            )
          )}
        </div>
      </motion.div>

      {/* Main Tabs - Mentors vs Stories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="mentors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mentors
          </TabsTrigger>
          <TabsTrigger value="stories" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Stories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mentors" className="mt-6 space-y-6">

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mentors by name or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </motion.div>

      {/* Expertise Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeExpertise} onValueChange={setActiveExpertise}>
          <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
            {expertiseAreas.map((area) => (
              <TabsTrigger
                key={area}
                value={area}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4"
              >
                {area}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Mentors Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor, index) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/dashboard/mentor/${mentor.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/10">
                      <AvatarImage src={mentor.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-lg">
                        {mentor.profile?.full_name?.split(" ").map((n: string) => n[0]).join("") || "M"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground truncate">
                          {mentor.profile?.full_name || "Mentor"}
                        </h3>
                        {mentor.is_verified && (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {mentor.profile?.headline || "Industry Expert"}
                      </p>
                      {mentor.profile?.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {mentor.profile.location}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {mentor.bio || "Experienced mentor ready to help you grow."}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {mentor.expertise?.slice(0, 3).map((exp: string) => (
                      <Badge key={exp} variant="secondary" className="text-xs">
                        {exp}
                      </Badge>
                    ))}
                    {mentor.expertise && mentor.expertise.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{mentor.expertise.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{mentor.rating || "New"}</span>
                    {mentor.total_reviews > 0 && (
                      <span className="text-sm text-muted-foreground">({mentor.total_reviews} reviews)</span>
                    )}
                  </div>
                  {user && user.id !== mentor.user_id ? (
                    <ConnectButton targetUserId={mentor.user_id} size="sm" />
                  ) : (
                    <Button 
                      size="sm" 
                      disabled={mentor.availability === "unavailable"}
                      className={mentor.availability !== "unavailable" ? "gradient-accent text-accent-foreground" : ""}
                    >
                      {mentor.availability !== "unavailable" ? (
                        <>
                          <Calendar className="h-4 w-4 mr-1" />
                          Book
                        </>
                      ) : (
                        "Unavailable"
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

          {!isLoading && filteredMentors.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No mentors found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </TabsContent>

        {/* Stories Tab */}
        <TabsContent value="stories" className="mt-6">
          {storiesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stories.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {stories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={story.mentor?.profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                              {story.mentor?.profile?.full_name?.split(" ").map((n: string) => n[0]).join("") || "M"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{story.mentor?.profile?.full_name || "Mentor"}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(story.created_at!), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStoryColor(story.story_type)} gap-1`}>
                          {getStoryIcon(story.story_type)}
                          <span className="capitalize">{story.story_type}</span>
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-3">{story.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-4">{story.content}</p>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {story.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {story.comments_count || 0}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No stories yet</h3>
              <p className="text-muted-foreground">Be the first mentor to share your journey</p>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Apply as Mentor Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Apply to Become a Mentor
            </DialogTitle>
            <DialogDescription>
              Share your expertise with aspiring entrepreneurs
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio *</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about your professional background..."
                value={application.bio}
                onChange={(e) => setApplication(prev => ({ ...prev, bio: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="motivation">Why do you want to mentor? *</Label>
              <Textarea
                id="motivation"
                placeholder="What motivates you to help others..."
                value={application.motivation}
                onChange={(e) => setApplication(prev => ({ ...prev, motivation: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="years">Years of Experience</Label>
                <Input
                  id="years"
                  type="number"
                  placeholder="e.g., 10"
                  value={application.years_experience}
                  onChange={(e) => setApplication(prev => ({ ...prev, years_experience: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/..."
                  value={application.linkedin_url}
                  onChange={(e) => setApplication(prev => ({ ...prev, linkedin_url: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Areas of Expertise * (Select at least 1)</Label>
              <div className="flex flex-wrap gap-2">
                {expertiseOptions.map((exp) => (
                  <Badge
                    key={exp}
                    variant={application.expertise_areas.includes(exp) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20"
                    onClick={() => toggleExpertise(exp)}
                  >
                    {exp}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={!application.bio || !application.motivation || application.expertise_areas.length === 0 || isSubmitting}
              className="gradient-accent text-accent-foreground"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Story Modal */}
      <Dialog open={showStoryModal} onOpenChange={setShowStoryModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Share Your Story
            </DialogTitle>
            <DialogDescription>
              Share your experiences, lessons, and insights with the community
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="story-type">Story Type</Label>
              <Select 
                value={newStory.story_type} 
                onValueChange={(value: "success" | "failure" | "learning") => 
                  setNewStory(prev => ({ ...prev, story_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select story type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Success Story
                    </span>
                  </SelectItem>
                  <SelectItem value="failure">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Failure & Lessons
                    </span>
                  </SelectItem>
                  <SelectItem value="learning">
                    <span className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500" />
                      Key Learning
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="story-title">Title *</Label>
              <Input
                id="story-title"
                placeholder="Give your story a compelling title..."
                value={newStory.title}
                onChange={(e) => setNewStory(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="story-content">Your Story *</Label>
              <Textarea
                id="story-content"
                placeholder="Share your experience, what happened, and what you learned..."
                value={newStory.content}
                onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[150px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStoryModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateStory} 
              disabled={!newStory.title || !newStory.content || isSubmitting}
              className="gradient-accent text-accent-foreground"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Share Story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
