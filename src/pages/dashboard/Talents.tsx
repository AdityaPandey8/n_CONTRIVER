import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  MapPin,
  Briefcase,
  Star,
  ExternalLink,
  Loader2,
  Plus,
  ChevronDown,
  Clock,
  DollarSign,
  CheckCircle,
  Info,
  ArrowLeft,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTalents } from "@/hooks/useTalents";
import { useAuth } from "@/contexts/AuthContext";
import { ConnectButton } from "@/components/connections/ConnectButton";

const skillCategories = [
  "React", "Node.js", "Python", "TypeScript", "AWS", "Machine Learning",
  "UI/UX Design", "Product Management", "Marketing", "Sales", "Finance"
];

const availabilityOptions = [
  { value: "all", label: "All" },
  { value: "available", label: "Available Now" },
  { value: "open", label: "Open to Opportunities" },
];

export default function Talents() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [minExperience, setMinExperience] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [showInfo, setShowInfo] = useState(false);
  
  // Form state for talent profile
  const [talentForm, setTalentForm] = useState({
    title: "",
    bio: "",
    skills: [] as string[],
    experience_years: 1,
    availability: "available" as "available" | "open" | "not_available",
    preferred_work_type: [] as string[],
    portfolio_url: "",
    expected_salary_min: null as number | null,
    expected_salary_max: null as number | null,
    resume_url: null as string | null,
  });

  const { 
    talents, 
    featuredTalents,
    myTalentProfile,
    isLoading, 
    upsertTalentProfile,
    deleteTalentProfile,
    hasTalentProfile,
  } = useTalents({
    skills: selectedSkills.length > 0 ? selectedSkills : undefined,
    availability: selectedAvailability !== "all" ? selectedAvailability : undefined,
    minExperience: minExperience > 0 ? minExperience : undefined,
    search: searchQuery || undefined,
  });

  const handleSaveProfile = async () => {
    if (!talentForm.title || talentForm.skills.length === 0) {
      return;
    }
    await upsertTalentProfile.mutateAsync(talentForm);
    setShowCreateProfile(false);
  };

  const toggleSkillSelection = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleFormSkill = (skill: string) => {
    setTalentForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "open":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background overflow-y-auto"
          >
            <div className="max-w-2xl mx-auto px-6 py-8">
              <Button variant="ghost" size="sm" onClick={() => setShowInfo(false)} className="mb-6 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <h2 className="text-2xl font-bold text-foreground mb-6">How Talents Works</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Create Your Profile
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Users can register as Talent by creating a talent profile: title, skills, experience years, bio, availability, expected salary range, preferred work type, portfolio URL, and resume.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Search className="h-5 w-5 text-primary" />
                    Discovery
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Recruiters and founders discover talent through filterable search (skills, experience, availability).
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Star className="h-5 w-5 text-primary" />
                    Featured Talents
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Featured talents can be highlighted for extra visibility.
                  </p>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    How They Connect
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    A recruiter posts a Job → talent users browse and apply. A recruiter browses the Talents pool → finds candidates and can reach out via the platform's messaging system.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Talent Marketplace
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowInfo(true)}>
              <Info className="h-4 w-4 text-muted-foreground" />
            </Button>
          </h1>
          <p className="text-muted-foreground mt-1">
            Find exceptional talent or showcase your skills
          </p>
        </div>
        {!hasTalentProfile ? (
          <Button 
            onClick={() => setShowCreateProfile(true)}
            className="gradient-accent text-accent-foreground shadow-glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Talent Profile
          </Button>
        ) : (
          <Button 
            variant="outline"
            onClick={() => {
              if (myTalentProfile) {
                setTalentForm({
                  title: myTalentProfile.title,
                  bio: myTalentProfile.bio || "",
                  skills: myTalentProfile.skills,
                  experience_years: myTalentProfile.experience_years || 1,
                  availability: myTalentProfile.availability as "available" | "open" | "not_available",
                  preferred_work_type: myTalentProfile.preferred_work_type || [],
                  portfolio_url: myTalentProfile.portfolio_url || "",
                  expected_salary_min: myTalentProfile.expected_salary_min,
                  expected_salary_max: myTalentProfile.expected_salary_max,
                  resume_url: myTalentProfile.resume_url,
                });
              }
              setShowCreateProfile(true);
            }}
          >
            Edit Your Profile
          </Button>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card/80 border border-border/50">
          <TabsTrigger value="browse">Browse Talents</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6 space-y-6">
          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, title, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  {availabilityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    More Filters
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Min Experience: {minExperience}+ years</Label>
                      <Slider
                        value={[minExperience]}
                        onValueChange={([value]) => setMinExperience(value)}
                        max={15}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Skills Filter */}
            <div className="flex flex-wrap gap-2">
              {skillCategories.slice(0, 8).map((skill) => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => toggleSkillSelection(skill)}
                >
                  {skill}
                </Badge>
              ))}
              {selectedSkills.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedSkills([])}
                  className="text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </motion.div>

          {/* Talents Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : talents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {talents.map((talent, index) => (
                <motion.div
                  key={talent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-border/50 cursor-pointer" onClick={() => navigate(`/dashboard/talent/${talent.id}`)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14 border-2 border-border">
                          <AvatarImage src={talent.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(talent.profile?.full_name || null)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground truncate">
                              {talent.profile?.full_name || "Anonymous"}
                            </h3>
                            {talent.is_featured && (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{talent.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={getAvailabilityColor(talent.availability)}
                            >
                              {talent.availability === "available" ? "Available Now" : "Open to Work"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {talent.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{talent.bio}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-1.5">
                        {talent.skills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {talent.skills.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{talent.skills.length - 4}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          <span>{talent.experience_years || 0} years</span>
                        </div>
                        {talent.profile?.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[100px]">{talent.profile.location}</span>
                          </div>
                        )}
                      </div>

                      {(talent.expected_salary_min || talent.expected_salary_max) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>
                            ${talent.expected_salary_min?.toLocaleString() || "0"} - ${talent.expected_salary_max?.toLocaleString() || "Negotiable"}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <ConnectButton targetUserId={talent.user_id} />
                        {talent.portfolio_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={talent.portfolio_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
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
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No talents found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or search</p>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          {featuredTalents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTalents.map((talent, index) => (
                <motion.div
                  key={talent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 bg-gradient-to-br from-card to-primary/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14 border-2 border-primary/30">
                          <AvatarImage src={talent.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(talent.profile?.full_name || null)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground truncate">
                              {talent.profile?.full_name || "Anonymous"}
                            </h3>
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{talent.title}</p>
                          <Badge 
                            variant="outline" 
                            className="mt-1 bg-green-500/10 text-green-600 border-green-500/20"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        {talent.skills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <ConnectButton targetUserId={talent.user_id} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No featured talents yet</h3>
              <p className="text-muted-foreground">Check back soon for highlighted profiles</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Talent Profile Modal */}
      <Dialog open={showCreateProfile} onOpenChange={setShowCreateProfile}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {hasTalentProfile ? "Edit Your Talent Profile" : "Create Talent Profile"}
            </DialogTitle>
            <DialogDescription>
              Showcase your skills to potential employers and collaborators
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Professional Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Full Stack Developer"
                value={talentForm.title}
                onChange={(e) => setTalentForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell potential employers about yourself..."
                value={talentForm.bio}
                onChange={(e) => setTalentForm(prev => ({ ...prev, bio: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Skills *</Label>
              <div className="flex flex-wrap gap-2">
                {skillCategories.map((skill) => (
                  <Badge
                    key={skill}
                    variant={talentForm.skills.includes(skill) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => toggleFormSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Select 
                  value={String(talentForm.experience_years)} 
                  onValueChange={(v) => setTalentForm(prev => ({ ...prev, experience_years: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}+ years</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Select 
                  value={talentForm.availability} 
                  onValueChange={(v: "available" | "open" | "not_available") => 
                    setTalentForm(prev => ({ ...prev, availability: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available Now</SelectItem>
                    <SelectItem value="open">Open to Opportunities</SelectItem>
                    <SelectItem value="not_available">Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio URL</Label>
              <Input
                id="portfolio"
                placeholder="https://yourportfolio.com"
                value={talentForm.portfolio_url}
                onChange={(e) => setTalentForm(prev => ({ ...prev, portfolio_url: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expected Salary (Min)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  value={talentForm.expected_salary_min || ""}
                  onChange={(e) => setTalentForm(prev => ({ 
                    ...prev, 
                    expected_salary_min: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Salary (Max)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 80000"
                  value={talentForm.expected_salary_max || ""}
                  onChange={(e) => setTalentForm(prev => ({ 
                    ...prev, 
                    expected_salary_max: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {hasTalentProfile && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  deleteTalentProfile.mutate();
                  setShowCreateProfile(false);
                }}
                disabled={deleteTalentProfile.isPending}
                className="sm:mr-auto"
              >
                Delete Profile
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowCreateProfile(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={upsertTalentProfile.isPending}>
              {upsertTalentProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
