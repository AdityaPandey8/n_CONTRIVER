import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket, Users, TrendingUp, Globe, Filter, Search, Building2, DollarSign, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useStartups } from "@/hooks/useStartups";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

const stages = ["All", "Idea", "MVP", "Growth", "Scaling"];
const industries = ["EdTech", "HealthTech", "FinTech", "CleanTech", "AgriTech", "AI/ML", "SaaS", "E-commerce", "Other"];

const getStageColor = (stage: string) => {
  switch (stage?.toLowerCase()) {
    case "idea":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "mvp":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "growth":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "scaling":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function Startups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startups, isLoading, registerStartup, myStartups } = useStartups();
  const userStartup = myStartups.length > 0 ? myStartups[0] : null;
  const [activeStage, setActiveStage] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newStartup, setNewStartup] = useState({
    name: "",
    tagline: "",
    description: "",
    industry: "EdTech",
    stage: "Idea",
    website_url: "",
    seeking_investment: false,
    investment_amount_sought: "",
  });

  const filteredStartups = startups.filter((startup) => {
    const matchesStage = activeStage === "All" || startup.stage?.toLowerCase() === activeStage.toLowerCase();
    const matchesSearch = startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          startup.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          startup.industry.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const handleCreateStartup = async () => {
    if (!newStartup.name || !newStartup.description) return;
    
    setIsSubmitting(true);
    try {
      await registerStartup.mutateAsync({
        name: newStartup.name,
        tagline: newStartup.tagline || null,
        description: newStartup.description,
        industry: newStartup.industry,
        stage: newStartup.stage.toLowerCase() as "idea" | "mvp" | "growth" | "scaling",
        website_url: newStartup.website_url || null,
        seeking_investment: newStartup.seeking_investment,
        investment_amount_sought: newStartup.investment_amount_sought ? Number(newStartup.investment_amount_sought) : null,
      });
      setShowCreateModal(false);
      setNewStartup({
        name: "",
        tagline: "",
        description: "",
        industry: "EdTech",
        stage: "Idea",
        website_url: "",
        seeking_investment: false,
        investment_amount_sought: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

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
            <Rocket className="h-8 w-8 text-primary" />
            Startups
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover and connect with innovative startups
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="gradient-accent text-accent-foreground shadow-glow"
          disabled={!!userStartup}
        >
          <Building2 className="h-4 w-4 mr-2" />
          {userStartup ? "Your Startup Registered" : "Register Your Startup"}
        </Button>
      </motion.div>

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
            placeholder="Search startups by name, tagline, or industry..."
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

      {/* Stage Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeStage} onValueChange={setActiveStage}>
          <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
            {stages.map((stage) => (
              <TabsTrigger
                key={stage}
                value={stage}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4"
              >
                {stage}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Startups Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.map((startup, index) => (
            <motion.div
              key={startup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow group cursor-pointer" onClick={() => navigate(`/dashboard/startup/${startup.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 rounded-xl ring-2 ring-primary/10">
                      <AvatarImage src={startup.logo_url || undefined} className="rounded-xl" />
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-accent text-white text-lg font-bold">
                        {startup.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getStageColor(startup.stage)}>
                          {startup.stage}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {startup.industry}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">
                        {startup.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {startup.tagline || "Innovation in progress"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {startup.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{startup.user_count || 0} users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{formatCurrency(startup.amount_raised)}</span>
                    </div>
                    {startup.seeking_investment && (
                      <div className="col-span-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">
                          Seeking {formatCurrency(startup.investment_amount_sought)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {startup.created_at && (
                      <span>Founded {formatDistanceToNow(new Date(startup.created_at), { addSuffix: true })}</span>
                    )}
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filteredStartups.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No startups found</h3>
          <p className="text-muted-foreground mb-4">Be the first to register your startup!</p>
          <Button onClick={() => setShowCreateModal(true)}>Register Now</Button>
        </motion.div>
      )}

      {/* Create Startup Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Register Your Startup
            </DialogTitle>
            <DialogDescription>
              Share your startup with the community and attract investors
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Startup Name *</Label>
                <Input
                  id="name"
                  placeholder="Your startup name"
                  value={newStartup.name}
                  onChange={(e) => setNewStartup(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="A catchy one-liner"
                  value={newStartup.tagline}
                  onChange={(e) => setNewStartup(prev => ({ ...prev, tagline: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Tell us about your startup..."
                value={newStartup.description}
                onChange={(e) => setNewStartup(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select 
                  value={newStartup.industry} 
                  onValueChange={(value) => setNewStartup(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stage">Stage *</Label>
                <Select 
                  value={newStartup.stage} 
                  onValueChange={(value) => setNewStartup(prev => ({ ...prev, stage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.filter(s => s !== "All").map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                placeholder="https://yourstartup.com"
                value={newStartup.website_url}
                onChange={(e) => setNewStartup(prev => ({ ...prev, website_url: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="seeking"
                  checked={newStartup.seeking_investment}
                  onChange={(e) => setNewStartup(prev => ({ ...prev, seeking_investment: e.target.checked }))}
                  className="rounded border-input"
                />
                <Label htmlFor="seeking" className="text-sm">Seeking investment</Label>
              </div>
              
              {newStartup.seeking_investment && (
                <div className="flex-1">
                  <Input
                    placeholder="Amount sought (e.g., 500000)"
                    type="number"
                    value={newStartup.investment_amount_sought}
                    onChange={(e) => setNewStartup(prev => ({ ...prev, investment_amount_sought: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateStartup} 
              disabled={!newStartup.name || !newStartup.description || isSubmitting}
              className="gradient-accent text-accent-foreground"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Register Startup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
