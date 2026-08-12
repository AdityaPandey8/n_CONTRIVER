import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb, ThumbsUp, ThumbsDown, MessageSquare, Filter, Plus, Search, 
  TrendingUp, Sparkles, Loader2, Wand2, Brain, X, ChevronDown,
  Heart, Bookmark, Copy, Share2, Check, ArrowLeft, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import { ShareDialog } from "@/components/social/ShareDialog";
import { useIdeas } from "@/hooks/useIdeas";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const domains = [
  "all", "EdTech", "HealthTech", "GreenTech", "FinTech", 
  "Civic Tech", "Social Impact", "PropTech", "AI/ML", "E-commerce"
];

const SEED_DOMAINS = ["AI/ML", "FinTech", "HealthTech", "EdTech", "GreenTech", "Civic Tech", "Social Impact", "PropTech", "E-commerce"];

const getDomainColor = (domain: string) => {
  const colors: Record<string, string> = {
    "EdTech": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    "HealthTech": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    "GreenTech": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    "FinTech": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    "Civic Tech": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    "Social Impact": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    "PropTech": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    "AI/ML": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    "E-commerce": "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  };
  return colors[domain] || "bg-muted text-muted-foreground border-border";
};

// Hook for idea likes
function useIdeaLikes(ideaIds: string[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: likedIds = new Set<string>() } = useQuery({
    queryKey: ["idea-likes", user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase
        .from("likes")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "idea");
      return new Set(data?.map(l => l.target_id) || []);
    },
    enabled: !!user,
  });

  const toggleLike = useMutation({
    mutationFn: async ({ ideaId, ownerId }: { ideaId: string; ownerId?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const isLiked = likedIds.has(ideaId);
      if (isLiked) {
        const { error } = await supabase.from("likes").delete()
          .eq("user_id", user.id).eq("target_type", "idea").eq("target_id", ideaId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("likes").insert({
          user_id: user.id, target_type: "idea", target_id: ideaId,
        });
        if (error) throw error;
        if (ownerId && ownerId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: ownerId, actor_id: user.id, type: "like",
            title: "New like", message: "liked your idea",
            target_type: "idea", target_id: ideaId,
          });
        }
      }
      return { ideaId, wasLiked: isLiked };
    },
    onMutate: async ({ ideaId }) => {
      await queryClient.cancelQueries({ queryKey: ["idea-likes", user?.id] });
      const prev = queryClient.getQueryData<Set<string>>(["idea-likes", user?.id]);
      queryClient.setQueryData<Set<string>>(["idea-likes", user?.id], (old) => {
        const next = new Set(old || []);
        if (next.has(ideaId)) next.delete(ideaId); else next.add(ideaId);
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["idea-likes", user?.id], context.prev);
      toast({ title: "Failed to update like", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["idea-likes"] });
      queryClient.invalidateQueries({ queryKey: ["profile-liked"] });
    },
  });

  return { likedIds, toggleLike };
}

// Hook for idea saves
function useIdeaSaves() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: savedIds = new Set<string>() } = useQuery({
    queryKey: ["idea-saves", user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase
        .from("saved_posts")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "idea");
      return new Set(data?.map(s => s.target_id) || []);
    },
    enabled: !!user,
  });

  const toggleSave = useMutation({
    mutationFn: async (ideaId: string) => {
      if (!user) throw new Error("Not authenticated");
      const isSaved = savedIds.has(ideaId);
      if (isSaved) {
        const { error } = await supabase.from("saved_posts").delete()
          .eq("user_id", user.id).eq("target_type", "idea").eq("target_id", ideaId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("saved_posts").insert({
          user_id: user.id, target_type: "idea", target_id: ideaId,
        });
        if (error) throw error;
      }
      return !isSaved;
    },
    onMutate: async (ideaId) => {
      await queryClient.cancelQueries({ queryKey: ["idea-saves", user?.id] });
      const prev = queryClient.getQueryData<Set<string>>(["idea-saves", user?.id]);
      queryClient.setQueryData<Set<string>>(["idea-saves", user?.id], (old) => {
        const next = new Set(old || []);
        if (next.has(ideaId)) next.delete(ideaId); else next.add(ideaId);
        return next;
      });
      return { prev };
    },
    onSuccess: (saved) => {
      toast({ title: saved ? "Idea saved!" : "Idea unsaved" });
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["idea-saves", user?.id], context.prev);
      toast({ title: "Failed to update save", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["idea-saves"] });
      queryClient.invalidateQueries({ queryKey: ["profile-saved-ideas"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    },
  });

  return { savedIds, toggleSave };
}

// Hook for idea comments
function useIdeaComments(ideaId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["idea-comments", ideaId],
    queryFn: async () => {
      if (!ideaId) return [];
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("target_type", "idea")
        .eq("target_id", ideaId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(c => ({ ...c, author: profileMap.get(c.user_id) }));
    },
    enabled: !!ideaId,
  });

  const addComment = useMutation({
    mutationFn: async ({ content, ideaId: iId }: { content: string; ideaId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("comments").insert({
        user_id: user.id, target_type: "idea", target_id: iId, content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["idea-comments"] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });

  return { comments, isLoading, addComment };
}

export default function IdeasHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeDomain, setActiveDomain] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const [generateDomain, setGenerateDomain] = useState("EdTech");
  const [generateProblem, setGenerateProblem] = useState("");
  const [generateBudget, setGenerateBudget] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [shareIdea, setShareIdea] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSearchGenerating, setIsSearchGenerating] = useState(false);
  const [searchGenerated, setSearchGenerated] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);
  const [estimatingBudgetId, setEstimatingBudgetId] = useState<string | null>(null);
  const [budgetEstimate, setBudgetEstimate] = useState<any>(null);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const seedingRef = useRef(false);
  
  const [newIdea, setNewIdea] = useState({
    title: "", description: "", domain: "EdTech",
    target_market: "", problem_statement: "", solution: "",
  });
  
  const { ideas, isLoading, createIdea, vote, fetchNextPage, hasNextPage, isFetchingNextPage } = useIdeas(activeDomain);
  
  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { threshold: 0.1 });
    observerRef.current.observe(node);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const { likedIds, toggleLike } = useIdeaLikes(ideas.map(i => i.id));
  const { savedIds, toggleSave } = useIdeaSaves();
  const { comments, isLoading: commentsLoading, addComment } = useIdeaComments(selectedIdea?.id || null);

  // Auto-generate fresh AI ideas each time Ideas Hub opens
  useEffect(() => {
    if (isLoading || !user || seedingRef.current) return;
    seedingRef.current = true;
    
    const refreshIdeas = async () => {
      setIsSeeding(true);
      try {
        // Pick 2-3 random domains to generate fresh ideas
        const shuffled = [...SEED_DOMAINS].sort(() => Math.random() - 0.5);
        const domainsToGenerate = shuffled.slice(0, 3);
        
        for (const domain of domainsToGenerate) {
          try {
            const { data, error } = await supabase.functions.invoke("idea-generator", {
              body: { domain, count: 2 },
            });
            if (error || !data?.ideas) continue;
            
            for (const idea of data.ideas) {
              await createIdea.mutateAsync({
                title: idea.title,
                description: idea.description || idea.tagline || "",
                domain,
                target_market: idea.targetMarket || idea.target_market || "",
                problem_statement: idea.problem || "",
                solution: idea.solution || "",
                is_ai_generated: true,
              });
            }
          } catch {
            // Continue with next domain if one fails
          }
        }
      } finally {
        setIsSeeding(false);
      }
    };
    
    refreshIdeas();
    
    return () => { seedingRef.current = false; };
  }, [isLoading, user]);

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch = 
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const allDisplayIdeas = [...filteredIdeas, ...searchGenerated.map((idea, i) => ({
    ...idea,
    id: `search-gen-${i}`,
    is_ai_generated: true,
    votes_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
    is_search_generated: true,
  }))];

  const handleSubmitIdea = async () => {
    if (!newIdea.title || !newIdea.description) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    await createIdea.mutateAsync(newIdea);
    setShowSubmitModal(false);
    setNewIdea({ title: "", description: "", domain: "EdTech", target_market: "", problem_statement: "", solution: "" });
  };

  const handleGenerateIdeas = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("idea-generator", {
        body: { domain: generateDomain, problemArea: generateProblem || undefined, budgetConstraints: generateBudget || undefined },
      });
      if (error) throw error;
      setGeneratedIdeas(data.ideas || []);
      toast({ title: "Ideas generated!", description: `Generated ${data.ideas?.length || 0} innovative ideas` });
    } catch (error: any) {
      const errorMessage = error.message || "Could not generate ideas";
      const isQuotaError = errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota");
      toast({ 
        title: isQuotaError ? "AI Temporarily Unavailable" : "Generation failed", 
        description: isQuotaError ? "Please try again in a few minutes." : errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearchGenerate = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("idea-generator", {
        body: { domain: searchQuery, problem_area: searchQuery, count: 5 },
      });
      if (error) throw error;
      setSearchGenerated(data.ideas || []);
      toast({ title: `Generated ${data.ideas?.length || 0} ideas for "${searchQuery}"` });
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSearchGenerating(false);
    }
  };

  const handleSaveGeneratedIdea = async (idea: any) => {
    await createIdea.mutateAsync({
      title: idea.title,
      description: idea.description || idea.tagline || "",
      domain: idea.domain || generateDomain || searchQuery || "General",
      target_market: idea.targetMarket || idea.target_market,
      problem_statement: idea.problem,
      solution: idea.solution,
      is_ai_generated: true,
    });
    setGeneratedIdeas(prev => prev.filter(i => i.title !== idea.title));
    setSearchGenerated(prev => prev.filter(i => i.title !== idea.title));
  };

  const handleVote = async (ideaId: string, voteType: "up" | "down") => {
    if (!user) { toast({ title: "Please sign in to vote", variant: "destructive" }); return; }
    if (ideaId.startsWith("search-gen-")) return;
    await vote.mutateAsync({ ideaId, voteType });
  };

  const handleCopy = async (idea: any) => {
    const text = `${idea.title}\n\n${idea.description}${idea.problem_statement ? `\n\nProblem: ${idea.problem_statement}` : ""}${idea.solution ? `\n\nSolution: ${idea.solution}` : ""}${idea.target_market ? `\n\nTarget Market: ${idea.target_market}` : ""}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !selectedIdea?.id) return;
    await addComment.mutateAsync({ content: newCommentText.trim(), ideaId: selectedIdea.id });
    setNewCommentText("");
  };

  const handleEstimateBudget = async (idea: any) => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    setEstimatingBudgetId(idea.id);
    try {
      const { data, error } = await supabase.functions.invoke("idea-generator", {
        body: {
          mode: "estimate_budget",
          idea: {
            title: idea.title,
            description: idea.description || idea.tagline,
            problem_statement: idea.problem_statement || idea.problem,
            solution: idea.solution,
            target_market: idea.target_market || idea.targetMarket,
            domain: idea.domain,
          },
        },
      });
      if (error) throw error;
      setBudgetEstimate({ ...data, ideaTitle: idea.title });
      setShowBudgetDialog(true);
    } catch (error: any) {
      toast({ title: "Budget estimation failed", description: error.message, variant: "destructive" });
    } finally {
      setEstimatingBudgetId(null);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Full-screen detail view
  if (selectedIdea) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-card/80 backdrop-blur-sm shrink-0">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedIdea(null); setNewCommentText(""); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">{selectedIdea.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={`${getDomainColor(selectedIdea.domain)} text-xs`} variant="outline">
                {selectedIdea.domain}
              </Badge>
              {selectedIdea.is_ai_generated && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                  <Brain className="h-3 w-3 mr-1" /> AI
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Author */}
            {selectedIdea.author && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedIdea.author?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(selectedIdea.author?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{selectedIdea.author?.full_name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedIdea.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-foreground/90 text-lg leading-relaxed">{selectedIdea.description}</p>

            {/* Info sections */}
            {selectedIdea.problem_statement && (
              <div className="bg-secondary/30 rounded-xl p-5">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  🔍 Problem
                </h4>
                <p className="text-muted-foreground">{selectedIdea.problem_statement}</p>
              </div>
            )}

            {selectedIdea.solution && (
              <div className="bg-secondary/30 rounded-xl p-5">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  💡 Solution
                </h4>
                <p className="text-muted-foreground">{selectedIdea.solution}</p>
              </div>
            )}

            {selectedIdea.target_market && (
              <div className="bg-secondary/30 rounded-xl p-5">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  🎯 Target Market
                </h4>
                <p className="text-muted-foreground">{selectedIdea.target_market}</p>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between py-4 border-y border-border/50">
              <div className="flex items-center gap-4">
                <motion.button whileTap={{ scale: 0.75 }}
                  onClick={() => toggleLike.mutate({ ideaId: selectedIdea.id, ownerId: selectedIdea.user_id })}
                  className="focus:outline-none">
                  <motion.div animate={likedIds.has(selectedIdea.id) ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
                    <Heart className={`h-7 w-7 transition-colors duration-200 ${
                      likedIds.has(selectedIdea.id) ? "text-red-500 fill-red-500" : "text-foreground hover:text-muted-foreground"
                    }`} />
                  </motion.div>
                </motion.button>
                <button onClick={() => document.getElementById("detail-comment-input")?.focus()}
                  className="focus:outline-none">
                  <MessageSquare className="h-7 w-7 text-foreground hover:text-muted-foreground transition-colors" />
                </button>
                <button onClick={() => setShareIdea(selectedIdea)}
                  className="focus:outline-none">
                  <Share2 className="h-7 w-7 text-foreground hover:text-muted-foreground transition-colors" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => handleEstimateBudget(selectedIdea)}
                  disabled={estimatingBudgetId === selectedIdea.id}
                  className="focus:outline-none disabled:opacity-50">
                  {estimatingBudgetId === selectedIdea.id
                    ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    : <DollarSign className="h-6 w-6 text-foreground hover:text-emerald-500 transition-colors" />}
                </button>
                <button onClick={() => handleCopy(selectedIdea)}
                  className="focus:outline-none">
                  {copiedId === selectedIdea.id ? <Check className="h-6 w-6 text-green-500" /> : <Copy className="h-6 w-6 text-foreground hover:text-muted-foreground transition-colors" />}
                </button>
                <motion.button whileTap={{ scale: 0.75 }}
                  onClick={() => toggleSave.mutate(selectedIdea.id)}
                  className="focus:outline-none">
                  <motion.div animate={savedIds.has(selectedIdea.id) ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
                    <Bookmark className={`h-7 w-7 transition-colors duration-200 ${
                      savedIds.has(selectedIdea.id) ? "text-primary fill-primary" : "text-foreground hover:text-muted-foreground"
                    }`} />
                  </motion.div>
                </motion.button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4 pb-8">
              <h4 className="font-semibold text-foreground text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Comments
              </h4>

              {user && (
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input id="detail-comment-input" value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Add a comment..." className="flex-1 bg-secondary/30 border-border/50"
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(); }} />
                    <Button size="icon" onClick={handleAddComment} disabled={!newCommentText.trim() || addComment.isPending}>
                      {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {commentsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-6">No comments yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={comment.author?.avatar_url} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(comment.author?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-secondary/30 rounded-xl px-4 py-3">
                          <span className="font-medium text-sm text-foreground">{comment.author?.full_name || "User"}</span>
                          <p className="text-sm text-foreground/90 mt-1">{comment.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground px-3 mt-1 inline-block">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Share Dialog */}
        {shareIdea && (
          <ShareDialog open={!!shareIdea} onOpenChange={(open) => { if (!open) setShareIdea(null); }}
            title={shareIdea.title} url={`${window.location.origin}/dashboard/ideas/${shareIdea.id}`} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-8 w-8 text-primary" />
            Ideas Hub
          </h1>
          <p className="text-muted-foreground mt-1">Discover innovative ideas and share your own</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGenerateModal(true)} className="gap-2">
            <Wand2 className="h-4 w-4" /> AI Generate
          </Button>
          <Button onClick={() => setShowSubmitModal(true)} className="gradient-accent text-accent-foreground shadow-glow">
            <Plus className="h-4 w-4 mr-2" /> Submit Idea
          </Button>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search ideas or enter a domain to generate AI ideas..."
            value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSearchGenerated([]); }}
            className="pl-10"
            onKeyDown={(e) => { if (e.key === "Enter" && searchQuery.trim()) handleSearchGenerate(); }}
          />
        </div>
        {searchQuery.trim() && (
          <Button onClick={handleSearchGenerate} disabled={isSearchGenerating} variant="outline" className="gap-2">
            {isSearchGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate AI Ideas
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filters <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Most Voted</DropdownMenuItem>
            <DropdownMenuItem>Newest First</DropdownMenuItem>
            <DropdownMenuItem>Most Comments</DropdownMenuItem>
            <DropdownMenuItem>AI Generated Only</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Domain Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs value={activeDomain} onValueChange={(v) => { setActiveDomain(v); setSearchGenerated([]); }}>
          <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
            {domains.map((domain) => (
              <TabsTrigger key={domain} value={domain}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 capitalize">
                {domain === "all" ? "All" : domain}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Seeding banner */}
      {isSeeding && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-medium text-foreground">Populating Ideas Hub with trending ideas...</p>
            <p className="text-sm">Generating AI ideas across {SEED_DOMAINS.join(", ")}</p>
          </div>
        </motion.div>
      )}

      {/* Search AI generation banner */}
      {isSearchGenerating && (
        <div className="flex items-center justify-center gap-3 py-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Generating AI ideas for "{searchQuery}"...</span>
        </div>
      )}

      {/* Ideas Grid */}
      {isLoading && !isSeeding ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !isSeeding && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allDisplayIdeas.map((idea: any) => {
            const isLiked = likedIds.has(idea.id);
            const isSaved = savedIds.has(idea.id);
            return (
            <motion.div key={idea.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}>
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow group border-border/50 overflow-hidden">
                {/* Double-tap area with heart animation */}
                <div className="relative"
                  onDoubleClick={() => {
                    if (idea.is_search_generated) return;
                    if (!isLiked) {
                      toggleLike.mutate({ ideaId: idea.id, ownerId: idea.user_id });
                    }
                    // Show heart animation
                    const el = document.getElementById(`heart-anim-${idea.id}`);
                    if (el) {
                      el.classList.remove("hidden");
                      el.classList.add("animate-instagram-heart");
                      setTimeout(() => {
                        el.classList.add("hidden");
                        el.classList.remove("animate-instagram-heart");
                      }, 900);
                    }
                  }}
                >
                  {/* Heart overlay animation */}
                  <div id={`heart-anim-${idea.id}`} className="hidden absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <Heart className="h-16 w-16 text-red-500 fill-red-500 drop-shadow-lg" />
                  </div>

                  <CardHeader className="pb-3 cursor-pointer" onClick={() => !idea.is_search_generated && setSelectedIdea(idea)}>
                    <div className="flex items-start justify-between gap-2">
                      <Badge className={getDomainColor(idea.domain)} variant="outline">{idea.domain}</Badge>
                      <div className="flex gap-1">
                        {idea.is_ai_generated && (
                          <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary border-0">
                            <Brain className="h-3 w-3" /> AI
                          </Badge>
                        )}
                        {idea.is_search_generated && (
                          <Badge variant="secondary" className="flex items-center gap-1 bg-amber-500/10 text-amber-600 border-0">
                            <Sparkles className="h-3 w-3" /> New
                          </Badge>
                        )}
                        {(idea.votes_count || 0) > 50 && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Hot
                          </Badge>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mt-2">
                      {idea.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="flex-1 cursor-pointer" onClick={() => !idea.is_search_generated && setSelectedIdea(idea)}>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {idea.description || idea.tagline}
                    </p>
                    {idea.target_market && (
                      <p className="text-xs text-muted-foreground/70 mt-2">Target: {idea.target_market}</p>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="flex flex-col gap-3 pt-4 border-t border-border/50">
                  {/* Author row */}
                  {idea.author && (
                    <div className="flex items-center gap-2 w-full">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={idea.author?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(idea.author?.full_name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{idea.author?.full_name || "Anonymous"}</span>
                      <span className="text-xs text-muted-foreground/70 ml-auto">
                        {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                  
                  {/* Action buttons - Instagram style */}
                  <div className="flex items-center justify-between w-full">
                    {idea.is_search_generated ? (
                      <Button size="sm" onClick={() => handleSaveGeneratedIdea(idea)} disabled={createIdea.isPending}>
                        <Plus className="h-3 w-3 mr-1" /> Save to Hub
                      </Button>
                    ) : (
                      <>
                        {/* Left: like, comment, share */}
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileTap={{ scale: 0.75 }}
                            onClick={(e) => { e.stopPropagation(); toggleLike.mutate({ ideaId: idea.id, ownerId: idea.user_id }); }}
                            className="focus:outline-none"
                          >
                            <motion.div
                              animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Heart className={`h-6 w-6 transition-colors duration-200 ${
                                isLiked ? "text-red-500 fill-red-500" : "text-foreground hover:text-muted-foreground"
                              }`} />
                            </motion.div>
                          </motion.button>
                          <button onClick={() => setSelectedIdea(idea)}
                            className="focus:outline-none">
                            <MessageSquare className="h-6 w-6 text-foreground hover:text-muted-foreground transition-colors" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setShareIdea(idea); }}
                            className="focus:outline-none">
                            <Share2 className="h-6 w-6 text-foreground hover:text-muted-foreground transition-colors" />
                          </button>
                        </div>
                        {/* Right: budget, copy, save */}
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); handleEstimateBudget(idea); }}
                            disabled={estimatingBudgetId === idea.id}
                            className="focus:outline-none disabled:opacity-50">
                            {estimatingBudgetId === idea.id
                              ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              : <DollarSign className="h-5 w-5 text-foreground hover:text-emerald-500 transition-colors" />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleCopy(idea); }}
                            className="focus:outline-none">
                            {copiedId === idea.id
                              ? <Check className="h-5 w-5 text-green-500" />
                              : <Copy className="h-5 w-5 text-foreground hover:text-muted-foreground transition-colors" />}
                          </button>
                          <motion.button
                            whileTap={{ scale: 0.75 }}
                            onClick={(e) => { e.stopPropagation(); toggleSave.mutate(idea.id); }}
                            className="focus:outline-none"
                          >
                            <motion.div
                              animate={isSaved ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Bookmark className={`h-6 w-6 transition-colors duration-200 ${
                                isSaved ? "text-primary fill-primary" : "text-foreground hover:text-muted-foreground"
                              }`} />
                            </motion.div>
                          </motion.button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Like count and comments count - Instagram style */}
                  {!idea.is_search_generated && (
                    <div className="w-full space-y-0.5">
                      {(idea.votes_count > 0 || isLiked) && (
                        <p className="text-sm font-semibold text-foreground">
                          {idea.votes_count || 0} {idea.votes_count === 1 ? "vote" : "votes"}
                        </p>
                      )}
                      {idea.comments_count > 0 && (
                        <button onClick={() => setSelectedIdea(idea)}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                          View all {idea.comments_count} comments
                        </button>
                      )}
                    </div>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {!isLoading && !isSeeding && hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {isFetchingNextPage && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {!isLoading && !isSeeding && allDisplayIdeas.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No ideas found</h3>
          <p className="text-muted-foreground mb-4">Try searching a domain to generate AI ideas, or submit your own!</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => { setSearchQuery("EdTech"); handleSearchGenerate(); }}>
              <Sparkles className="h-4 w-4 mr-2" /> Generate AI Ideas
            </Button>
            <Button onClick={() => setShowSubmitModal(true)}>Submit Your Idea</Button>
          </div>
        </motion.div>
      )}

      {/* Share Dialog */}
      {shareIdea && (
        <ShareDialog open={!!shareIdea} onOpenChange={(open) => { if (!open) setShareIdea(null); }}
          title={shareIdea.title} url={`${window.location.origin}/dashboard/ideas/${shareIdea.id}`} />
      )}

      {/* Submit Idea Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" /> Submit Your Idea
            </DialogTitle>
            <DialogDescription>Share your innovative idea with the community</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="A catchy title for your idea"
                value={newIdea.title} onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" placeholder="Describe your idea in detail..."
                value={newIdea.description} onChange={(e) => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain *</Label>
                <Select value={newIdea.domain} onValueChange={(value) => setNewIdea(prev => ({ ...prev, domain: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {domains.filter(d => d !== "all").map((domain) => (
                      <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_market">Target Market</Label>
                <Input id="target_market" placeholder="e.g., College students"
                  value={newIdea.target_market} onChange={(e) => setNewIdea(prev => ({ ...prev, target_market: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="problem">Problem Statement</Label>
              <Textarea id="problem" placeholder="What problem does this solve?"
                value={newIdea.problem_statement} onChange={(e) => setNewIdea(prev => ({ ...prev, problem_statement: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solution">Proposed Solution</Label>
              <Textarea id="solution" placeholder="How does your idea solve this problem?"
                value={newIdea.solution} onChange={(e) => setNewIdea(prev => ({ ...prev, solution: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>Cancel</Button>
            <Button onClick={handleSubmitIdea} disabled={createIdea.isPending}>
              {createIdea.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : <><Plus className="h-4 w-4 mr-2" /> Submit Idea</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate Ideas Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" /> AI Idea Generator
            </DialogTitle>
            <DialogDescription>Let AI help you brainstorm innovative ideas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Domain</Label>
                <Select value={generateDomain} onValueChange={setGenerateDomain}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {domains.filter(d => d !== "all").map((domain) => (
                      <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Problem Area (Optional)</Label>
                <Input placeholder="e.g., student engagement"
                  value={generateProblem} onChange={(e) => setGenerateProblem(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget Constraints (Optional)</Label>
              <Input placeholder="e.g., $10K bootstrap, $100K seed funding"
                value={generateBudget} onChange={(e) => setGenerateBudget(e.target.value)} />
            </div>
            <Button onClick={handleGenerateIdeas} disabled={isGenerating} className="w-full">
              {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Ideas...</> : <><Brain className="h-4 w-4 mr-2" /> Generate Ideas</>}
            </Button>
            {generatedIdeas.length > 0 && (
              <div className="space-y-4 mt-6">
                <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Generated Ideas
                </h4>
                {generatedIdeas.map((idea, index) => (
                  <Card key={index} className="border-border/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <h5 className="font-semibold text-foreground">{idea.title}</h5>
                        <Button size="sm" variant="ghost" onClick={() => setGeneratedIdeas(prev => prev.filter((_, i) => i !== index))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {idea.tagline && <p className="text-sm text-muted-foreground italic">{idea.tagline}</p>}
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground mb-2">{idea.description}</p>
                      {idea.problem && <p className="text-xs text-muted-foreground/70"><strong>Problem:</strong> {idea.problem}</p>}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button size="sm" onClick={() => handleSaveGeneratedIdea(idea)} disabled={createIdea.isPending}>
                        <Plus className="h-3 w-3 mr-1" /> Save to Ideas Hub
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Estimate Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" /> Budget Estimate
            </DialogTitle>
            <DialogDescription>
              AI-generated budget estimate for: <span className="font-medium text-foreground">{budgetEstimate?.ideaTitle}</span>
            </DialogDescription>
          </DialogHeader>
          {budgetEstimate && (
            <div className="space-y-5 py-2">
              {/* Total Estimate */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Estimated Total Budget</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{budgetEstimate.totalEstimate}</p>
                {budgetEstimate.timeline && (
                  <p className="text-sm text-muted-foreground mt-1">Timeline: {budgetEstimate.timeline}</p>
                )}
              </div>

              {/* Breakdown Table */}
              {budgetEstimate.breakdown?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-sm">Cost Breakdown</h4>
                  <div className="border border-border/50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Category</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Estimate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgetEstimate.breakdown.map((item: any, i: number) => (
                          <tr key={i} className="border-t border-border/30">
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{item.category}</p>
                              {item.details && <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap">{item.estimate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Assumptions */}
              {budgetEstimate.assumptions?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-sm">Key Assumptions</h4>
                  <ul className="space-y-1">
                    {budgetEstimate.assumptions.map((a: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cost Saving Tips */}
              {budgetEstimate.costSavingTips?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-sm">💡 Cost Saving Tips</h4>
                  <ul className="space-y-1">
                    {budgetEstimate.costSavingTips.map((tip: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={async () => {
              if (!budgetEstimate) return;
              const text = `Budget Estimate: ${budgetEstimate.ideaTitle}\n\nTotal: ${budgetEstimate.totalEstimate}\nTimeline: ${budgetEstimate.timeline || "N/A"}\n\n${
                budgetEstimate.breakdown?.map((b: any) => `${b.category}: ${b.estimate}${b.details ? ` — ${b.details}` : ""}`).join("\n") || ""
              }`;
              await navigator.clipboard.writeText(text);
              toast({ title: "Budget estimate copied!" });
            }}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
            <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
