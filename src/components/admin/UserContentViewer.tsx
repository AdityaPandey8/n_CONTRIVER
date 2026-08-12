import { useState, useEffect, useCallback } from "react";
import { Eye, FileText, Lightbulb, Video, Building2, Loader2, Trash2, EyeOff, EyeIcon, ExternalLink, Heart, MessageCircle, Share2, Calendar, Tag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface UserContentViewerProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserContentViewer({ userId, userName, open, onOpenChange }: UserContentViewerProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [shorts, setShorts] = useState<any[]>([]);
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ table: string; id: string; label: string } | null>(null);
  const [viewItem, setViewItem] = useState<{ type: "post" | "idea" | "short" | "startup"; data: any } | null>(null);
  const { toast } = useToast();

  const fetchContent = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("ideas").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("shorts").select("*").eq("creator_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("startups").select("*").eq("founder_id", userId).order("created_at", { ascending: false }).limit(50),
    ]).then(([postsRes, ideasRes, shortsRes, startupsRes]) => {
      setPosts(postsRes.data || []);
      setIdeas(ideasRes.data || []);
      setShorts(shortsRes.data || []);
      setStartups(startupsRes.data || []);
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    if (open && userId) fetchContent();
  }, [open, userId, fetchContent]);

  const handleTogglePublish = async (table: "posts" | "ideas" | "shorts", id: string, currentStatus: boolean) => {
    const { error } = await supabase.from(table).update({ is_published: !currentStatus }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentStatus ? "Unpublished" : "Republished", description: `Content has been ${currentStatus ? "unpublished" : "republished"}.` });
      fetchContent();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { table, id } = deleteTarget;
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Content has been permanently deleted." });
      fetchContent();
    }
    setDeleteTarget(null);
  };

  const totalContent = posts.length + ideas.length + shorts.length + startups.length;

  const ActionButtons = ({ table, id, isPublished, label, type, data }: { table: string; id: string; isPublished?: boolean; label: string; type: "post" | "idea" | "short" | "startup"; data: any }) => (
    <div className="flex gap-1.5 shrink-0">
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs"
        onClick={() => setViewItem({ type, data })}
      >
        <Eye className="h-3 w-3 mr-1" />View
      </Button>
      {isPublished !== undefined && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => handleTogglePublish(table as "posts" | "ideas" | "shorts", id, isPublished)}
        >
          {isPublished ? <><EyeOff className="h-3 w-3 mr-1" />Unpublish</> : <><EyeIcon className="h-3 w-3 mr-1" />Publish</>}
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        className="h-7 px-2 text-xs"
        onClick={() => setDeleteTarget({ table, id, label })}
      >
        <Trash2 className="h-3 w-3 mr-1" />Delete
      </Button>
    </div>
  );

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
    if (!value) return null;
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-sm text-foreground">{value}</span>
      </div>
    );
  };

  const renderViewDialog = () => {
    if (!viewItem) return null;
    const { type, data } = viewItem;

    return (
      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {type === "post" && <FileText className="h-5 w-5 text-primary" />}
              {type === "idea" && <Lightbulb className="h-5 w-5 text-warning" />}
              {type === "short" && <Video className="h-5 w-5 text-accent" />}
              {type === "startup" && <Building2 className="h-5 w-5 text-success" />}
              {type === "post" ? (data.caption || "Post") : type === "idea" ? data.title : type === "short" ? data.title : data.name}
            </DialogTitle>
            <DialogDescription>
              Full content details for admin review
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              {/* Media preview */}
              {(type === "post" || type === "short") && data.media_url && (
                <div className="rounded-lg overflow-hidden border border-border bg-muted">
                  {data.content_type === "video" || type === "short" ? (
                    <video src={data.media_url} controls className="w-full max-h-72 object-contain bg-black" />
                  ) : (
                    <img src={data.media_url} alt="Content media" className="w-full max-h-72 object-contain" />
                  )}
                </div>
              )}

              {/* Thumbnail for shorts */}
              {type === "short" && data.thumbnail_url && !data.media_url && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img src={data.thumbnail_url} alt="Thumbnail" className="w-full max-h-48 object-contain" />
                </div>
              )}

              {/* Startup logo */}
              {type === "startup" && data.logo_url && (
                <div className="flex items-center gap-3">
                  <img src={data.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-border" />
                  {data.tagline && <p className="text-sm text-muted-foreground italic">{data.tagline}</p>}
                </div>
              )}

              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                {data.is_published === false && <Badge variant="destructive">Unpublished</Badge>}
                {data.is_published === true && <Badge className="bg-success/10 text-success border-0">Published</Badge>}
                {type === "post" && data.content_type && <Badge variant="outline">{data.content_type}</Badge>}
                {type === "short" && data.category && <Badge variant="outline">{data.category}</Badge>}
                {type === "idea" && data.domain && <Badge variant="secondary">{data.domain}</Badge>}
                {type === "idea" && data.is_ai_generated && <Badge variant="outline">AI Generated</Badge>}
                {type === "startup" && data.industry && <Badge variant="secondary">{data.industry}</Badge>}
                {type === "startup" && data.stage && <Badge variant="outline">{data.stage}</Badge>}
                {type === "startup" && data.is_verified && <Badge className="bg-success/10 text-success border-0">Verified</Badge>}
              </div>

              <Separator />

              {/* Content body */}
              {type === "post" && (
                <div className="space-y-3">
                  <DetailRow label="Caption" value={data.caption} />
                  <DetailRow label="Description" value={data.description} />
                </div>
              )}

              {type === "idea" && (
                <div className="space-y-3">
                  <DetailRow label="Description" value={data.description} />
                  <DetailRow label="Problem Statement" value={data.problem_statement} />
                  <DetailRow label="Solution" value={data.solution} />
                  <DetailRow label="Target Market" value={data.target_market} />
                </div>
              )}

              {type === "short" && (
                <div className="space-y-3">
                  <DetailRow label="Description" value={data.description} />
                  <DetailRow label="Duration" value={data.duration_seconds ? `${data.duration_seconds}s` : null} />
                  {data.video_url && (
                    <DetailRow label="Video URL" value={
                      <a href={data.video_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
                        Open video <ExternalLink className="h-3 w-3" />
                      </a>
                    } />
                  )}
                </div>
              )}

              {type === "startup" && (
                <div className="space-y-3">
                  <DetailRow label="Description" value={data.description} />
                  <DetailRow label="Funding Status" value={data.funding_status} />
                  <DetailRow label="Amount Raised" value={data.amount_raised ? `$${Number(data.amount_raised).toLocaleString()}` : null} />
                  <DetailRow label="Revenue" value={data.revenue ? `$${Number(data.revenue).toLocaleString()}` : null} />
                  <DetailRow label="Users" value={data.user_count} />
                  <DetailRow label="Growth Rate" value={data.growth_rate} />
                  {data.website_url && (
                    <DetailRow label="Website" value={
                      <a href={data.website_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
                        {data.website_url} <ExternalLink className="h-3 w-3" />
                      </a>
                    } />
                  )}
                </div>
              )}

              <Separator />

              {/* Engagement stats */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {data.likes_count !== undefined && (
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{data.likes_count} likes</span>
                )}
                {data.comments_count !== undefined && (
                  <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{data.comments_count} comments</span>
                )}
                {data.shares_count !== undefined && (
                  <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" />{data.shares_count} shares</span>
                )}
                {data.views_count !== undefined && (
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{data.views_count} views</span>
                )}
                {data.votes_count !== undefined && (
                  <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{data.votes_count} votes</span>
                )}
              </div>

              {/* Timestamps */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {data.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />Created: {format(new Date(data.created_at), "PPp")}
                  </span>
                )}
                {data.updated_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />Updated: {format(new Date(data.updated_at), "PPp")}
                  </span>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {userName}'s Content
            </SheetTitle>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">{totalContent} total items</p>
              <Tabs defaultValue="posts" className="space-y-4">
                <TabsList className="w-full">
                  <TabsTrigger value="posts" className="flex-1 gap-1"><FileText className="h-3.5 w-3.5" />Posts ({posts.length})</TabsTrigger>
                  <TabsTrigger value="ideas" className="flex-1 gap-1"><Lightbulb className="h-3.5 w-3.5" />Ideas ({ideas.length})</TabsTrigger>
                  <TabsTrigger value="shorts" className="flex-1 gap-1"><Video className="h-3.5 w-3.5" />Shorts ({shorts.length})</TabsTrigger>
                  <TabsTrigger value="startups" className="flex-1 gap-1"><Building2 className="h-3.5 w-3.5" />Startups ({startups.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-3">
                  {posts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No posts</p>}
                  {posts.map((post) => (
                    <Card key={post.id} className="border-border/50">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{post.content_type}</Badge>
                            {!post.is_published && <Badge variant="destructive" className="text-xs">Unpublished</Badge>}
                          </div>
                          <ActionButtons table="posts" id={post.id} isPublished={post.is_published} label={post.caption || "Post"} type="post" data={post} />
                        </div>
                        {post.media_url && (
                          <div className="rounded-md overflow-hidden border border-border h-20 w-full">
                            {post.content_type === "video" ? (
                              <video src={post.media_url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                        )}
                        <p className="text-sm text-foreground line-clamp-3">{post.caption || post.description || "No text"}</p>
                        <p className="text-xs text-muted-foreground">
                          {post.likes_count} likes · {post.comments_count} comments · {post.created_at && formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="ideas" className="space-y-3">
                  {ideas.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No ideas</p>}
                  {ideas.map((idea) => (
                    <Card key={idea.id} className="border-border/50">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-foreground truncate">{idea.title}</h4>
                          <ActionButtons table="ideas" id={idea.id} isPublished={idea.is_published} label={idea.title} type="idea" data={idea} />
                        </div>
                        {!idea.is_published && <Badge variant="destructive" className="text-xs">Unpublished</Badge>}
                        <p className="text-sm text-muted-foreground line-clamp-2">{idea.description}</p>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">{idea.domain}</Badge>
                          <span className="text-xs text-muted-foreground">{idea.votes_count} votes</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="shorts" className="space-y-3">
                  {shorts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No shorts</p>}
                  {shorts.map((short) => (
                    <Card key={short.id} className="border-border/50">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-foreground truncate">{short.title}</h4>
                          <ActionButtons table="shorts" id={short.id} isPublished={short.is_published} label={short.title} type="short" data={short} />
                        </div>
                        {!short.is_published && <Badge variant="destructive" className="text-xs">Unpublished</Badge>}
                        <p className="text-sm text-muted-foreground line-clamp-2">{short.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {short.views_count} views · {short.likes_count} likes · {short.category}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="startups" className="space-y-3">
                  {startups.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No startups</p>}
                  {startups.map((startup) => (
                    <Card key={startup.id} className="border-border/50">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-foreground truncate">{startup.name}</h4>
                          <ActionButtons table="startups" id={startup.id} label={startup.name} type="startup" data={startup} />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{startup.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{startup.industry}</Badge>
                          <Badge variant="outline" className="text-xs">{startup.stage}</Badge>
                          {startup.is_verified && <Badge className="bg-success/10 text-success text-xs border-0">Verified</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {renderViewDialog()}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{deleteTarget?.label}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
