import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Phone,
  Camera,
  Loader2,
  Save,
  CheckCircle,
  Sparkles,
  Grid3X3,
  Play,
  Users,
  Plus,
  LinkIcon,
  UserPlus,
  Clock,
  Bookmark,
  Heart,
  MessageCircle,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { profileSchema, ProfileFormData } from "@/lib/validations";
import { usePosts } from "@/hooks/usePosts";
import { useShorts } from "@/hooks/useShorts";
import { useConnections } from "@/hooks/useConnections";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { PostCard, CreatePostModal } from "@/components/social";
import { ConnectionRequests } from "@/components/connections/ConnectionRequests";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export default function Profile() {
  const { profile, role, user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { posts: myPosts, isLoading: postsLoading } = usePosts();
  const { shorts: myShorts, isLoading: shortsLoading } = useShorts();
  const { 
    connections, 
    pendingRequests, 
    sentRequests, 
    loadingConnections 
  } = useConnections();
  const { savedPosts, savedShorts, isLoading: savedLoading } = useSavedPosts();

  const userPosts = myPosts.filter(post => post.user_id === user?.id);
  const userShorts = myShorts.filter(short => short.creator_id === user?.id);

  // Following query
  const { data: followingList = [], isLoading: followingLoading } = useQuery({
    queryKey: ["profile-following", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("follows")
        .select("following_id, created_at")
        .eq("follower_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = data.map(f => f.following_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline")
        .in("id", ids);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return data.map(f => ({ ...f, profile: profileMap.get(f.following_id) }));
    },
    enabled: !!user,
  });

  // Liked content query
  const { data: likedItems = [], isLoading: likedLoading } = useQuery({
    queryKey: ["profile-liked", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("likes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      // Enrich with content details
      const postIds = data.filter(l => l.target_type === "post").map(l => l.target_id);
      const ideaIds = data.filter(l => l.target_type === "idea").map(l => l.target_id);
      const shortIds = data.filter(l => l.target_type === "short").map(l => l.target_id);

      const [postsRes, ideasRes, shortsRes] = await Promise.all([
        postIds.length > 0 ? supabase.from("posts").select("id, caption, description, content_type").in("id", postIds) : { data: [] },
        ideaIds.length > 0 ? supabase.from("ideas").select("id, title, domain").in("id", ideaIds) : { data: [] },
        shortIds.length > 0 ? supabase.from("shorts").select("id, title, category").in("id", shortIds) : { data: [] },
      ]);

      const contentMap = new Map<string, any>();
      postsRes.data?.forEach(p => contentMap.set(p.id, { ...p, type: "post" }));
      ideasRes.data?.forEach(i => contentMap.set(i.id, { ...i, type: "idea" }));
      shortsRes.data?.forEach(s => contentMap.set(s.id, { ...s, type: "short" }));

      return data.map(l => ({ ...l, content: contentMap.get(l.target_id) }));
    },
    enabled: !!user,
  });

  // Commented content query
  const { data: commentedItems = [], isLoading: commentedLoading } = useQuery({
    queryKey: ["profile-commented", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Saved ideas query
  const { data: savedIdeas = [], isLoading: savedIdeasLoading } = useQuery({
    queryKey: ["profile-saved-ideas", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: saved, error } = await supabase
        .from("saved_posts")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "idea");
      if (error || !saved?.length) return [];
      const ids = saved.map(s => s.target_id);
      const { data: ideas } = await supabase
        .from("ideas")
        .select("id, title, description, domain")
        .in("id", ids);
      return ideas || [];
    },
    enabled: !!user,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      website: profile?.website || "",
      linkedin_url: profile?.linkedin_url || "",
      twitter_url: profile?.twitter_url || "",
      phone: profile?.phone || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    const { error } = await updateProfile(data);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    }
    setIsSubmitting(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.full_name,
      profile.bio,
      profile.location,
      profile.website,
      profile.linkedin_url,
      profile.avatar_url,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-border/50">
          <div className="h-36 bg-gradient-to-br from-primary via-primary/80 to-primary/60 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-card to-transparent" />
          </div>
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-20">
              <div className="relative group">
                <Avatar className="h-28 w-28 sm:h-36 sm:w-36 border-4 border-card shadow-xl">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-2 right-2 p-2.5 rounded-full bg-accent text-accent-foreground shadow-lg hover:scale-110 transition-transform">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 text-center sm:text-left pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {profile?.full_name || "Your Name"}
                  </h1>
                  {profile?.is_verified && (
                    <CheckCircle className="h-6 w-6 text-primary mx-auto sm:mx-0" />
                  )}
                </div>
                <p className="text-muted-foreground">{profile?.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 capitalize px-3 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {role}
                  </Badge>
                  {profile?.location && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </span>
                  )}
                </div>
                {/* Stats */}
                <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-center hover:opacity-80 transition-opacity">
                        <p className="text-xl font-bold text-foreground">{userPosts.length}</p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                      </button>
                    </DialogTrigger>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-center hover:opacity-80 transition-opacity">
                        <p className="text-xl font-bold text-foreground">{connections.length}</p>
                        <p className="text-xs text-muted-foreground">Connections</p>
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <LinkIcon className="h-5 w-5" />
                          Your Connections
                        </DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-96">
                        {loadingConnections ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : connections.length > 0 ? (
                          <div className="space-y-3">
                            {connections.map((connection) => (
                              <div key={connection.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={connection.profile?.avatar_url || undefined} />
                                  <AvatarFallback>{getInitials(connection.profile?.full_name || null)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{connection.profile?.full_name || "User"}</p>
                                </div>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {connection.connection_type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">No connections yet</p>
                        )}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  <button className="text-center hover:opacity-80 transition-opacity">
                    <p className="text-xl font-bold text-foreground">{followingList.length}</p>
                    <p className="text-xs text-muted-foreground">Following</p>
                  </button>
                  {pendingRequests.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-center hover:opacity-80 transition-opacity relative">
                          <p className="text-xl font-bold text-accent">{pendingRequests.length}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                          <span className="absolute -top-1 -right-1 h-3 w-3 bg-accent rounded-full animate-pulse" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Connection Requests
                          </DialogTitle>
                        </DialogHeader>
                        <ConnectionRequests />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full overflow-x-auto flex bg-card/80 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="posts" className="flex items-center gap-2 flex-1">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="shorts" className="flex items-center gap-2 flex-1">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Shorts</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2 flex-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Following</span>
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center gap-2 flex-1">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Liked</span>
            </TabsTrigger>
            <TabsTrigger value="commented" className="flex items-center gap-2 flex-1">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Commented</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2 flex-1">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2 flex-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">My Posts</h3>
              <Button onClick={() => setShowCreatePost(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            </div>
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center">
                  <Grid3X3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                  <p className="text-muted-foreground mb-4">Share your innovation journey with the community</p>
                  <Button onClick={() => setShowCreatePost(true)}>Create Your First Post</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Shorts Tab */}
          <TabsContent value="shorts" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">My Shorts</h3>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Short
              </Button>
            </div>
            {shortsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : userShorts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {userShorts.map((short) => (
                  <div key={short.id} className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted group cursor-pointer">
                    {short.thumbnail_url ? (
                      <img src={short.thumbnail_url} alt={short.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <Play className="h-8 w-8 text-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-sm font-medium truncate">{short.title}</p>
                        <p className="text-white/70 text-xs">{short.views_count} views</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center">
                  <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No shorts yet</h3>
                  <p className="text-muted-foreground mb-4">Share short-form videos about innovation and tech</p>
                  <Button>Upload Your First Short</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Following ({followingList.length})</h3>
            {followingLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : followingList.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {followingList.map((item: any) => (
                  <div key={item.following_id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.profile?.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(item.profile?.full_name || null)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.profile?.full_name || "User"}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.profile?.headline || "CONTRIVER Member"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">Not following anyone yet</h3>
                  <p className="text-muted-foreground mb-4">Discover and follow innovators in the community</p>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/social">Explore Feed</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Liked Tab */}
          <TabsContent value="liked" className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Liked Content ({likedItems.length})</h3>
            {likedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : likedItems.length > 0 ? (
              <div className="space-y-3">
                {likedItems.map((item: any) => {
                  const handleClick = () => {
                    if (item.target_type === "idea") navigate("/dashboard/ideas");
                    else if (item.target_type === "post") navigate("/dashboard/social");
                    else if (item.target_type === "short") navigate("/dashboard/shorts");
                  };
                  return (
                    <div key={item.id} onClick={handleClick}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <Heart className="h-5 w-5 text-red-500 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.content?.title || item.content?.caption || item.content?.description || "Content"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs capitalize">{item.target_type}</Badge>
                          {item.content?.domain && (
                            <Badge variant="secondary" className="text-xs">{item.content.domain}</Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No liked content yet</h3>
                  <p className="text-muted-foreground mb-4">Like posts, ideas, and shorts to see them here</p>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/social">Explore Feed</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Commented Tab */}
          <TabsContent value="commented" className="mt-6">
            <h3 className="text-lg font-semibold mb-4">My Comments ({commentedItems.length})</h3>
            {commentedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : commentedItems.length > 0 ? (
              <div className="space-y-3">
                {commentedItems.map((comment: any) => (
                  <div key={comment.id} className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs capitalize">{comment.target_type}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No comments yet</h3>
                  <p className="text-muted-foreground mb-4">Join conversations by commenting on posts and ideas</p>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/social">Explore Feed</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Saved Content</h3>
              <Badge variant="outline" className="gap-1">
                <Bookmark className="h-3 w-3" />
                {savedPosts.length + savedShorts.length + savedIdeas.length} items
              </Badge>
            </div>
            {(savedLoading || savedIdeasLoading) ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : savedPosts.length > 0 || savedShorts.length > 0 || savedIdeas.length > 0 ? (
              <div className="space-y-6">
                {/* Saved Ideas */}
                {savedIdeas.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Saved Ideas ({savedIdeas.length})
                    </h4>
                    <div className="space-y-3">
                      {savedIdeas.map((idea: any) => (
                        <div key={idea.id} onClick={() => navigate("/dashboard/ideas")}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Lightbulb className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{idea.title}</p>
                            <Badge variant="outline" className="text-xs mt-0.5">{idea.domain}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Saved Posts */}
                {savedPosts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4" />
                      Saved Posts ({savedPosts.length})
                    </h4>
                    <div className="space-y-4">
                      {savedPosts.map((post) => (
                        <PostCard key={post.id} post={post as any} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Saved Shorts */}
                {savedShorts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Saved Shorts ({savedShorts.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {savedShorts.map((short) => (
                        <Link 
                          key={short.id} 
                          to="/dashboard/shorts"
                          className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted group cursor-pointer"
                        >
                          {short.thumbnail_url ? (
                            <img src={short.thumbnail_url} alt={short.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <Play className="h-8 w-8 text-foreground/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-white text-sm font-medium truncate">{short.title}</p>
                              <div className="flex items-center gap-3 text-white/70 text-xs mt-1">
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {short.likes_count}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  {short.comments_count}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No saved content yet</h3>
                  <p className="text-muted-foreground mb-4">Bookmark posts, shorts, and ideas to access them later</p>
                  <Button asChild variant="outline">
                    <Link to="/dashboard/social">Explore Feed</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Edit Profile Tab */}
          <TabsContent value="edit" className="mt-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>Update your information</CardDescription>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Progress value={calculateCompletion()} className="w-24 h-2" />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {calculateCompletion()}% complete
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Full Name
                      </Label>
                      <Input
                        id="full_name"
                        placeholder="Your full name"
                        {...form.register("full_name")}
                      />
                      {form.formState.errors.full_name && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.full_name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 000-0000"
                        {...form.register("phone")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px] resize-none"
                      {...form.register("bio")}
                    />
                    {form.formState.errors.bio && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.bio.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        placeholder="City, Country"
                        {...form.register("location")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        placeholder="https://yourwebsite.com"
                        {...form.register("website")}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        LinkedIn
                      </Label>
                      <Input
                        id="linkedin_url"
                        placeholder="https://linkedin.com/in/username"
                        {...form.register("linkedin_url")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter_url" className="flex items-center gap-2">
                        <Twitter className="h-4 w-4 text-muted-foreground" />
                        Twitter/X
                      </Label>
                      <Input
                        id="twitter_url"
                        placeholder="https://twitter.com/username"
                        {...form.register("twitter_url")}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Create Post Modal */}
      <CreatePostModal open={showCreatePost} onOpenChange={setShowCreatePost} />
    </div>
  );
}
