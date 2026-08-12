import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Bookmark,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Post } from "@/hooks/usePosts";
import { useLike } from "@/hooks/useLikes";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { useAuth } from "@/contexts/AuthContext";
import { CommentSection } from "./CommentSection";
import { ShareDialog } from "./ShareDialog";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const { toggleLike } = useLike();
  const { isSaved, toggleSave } = useSavedPosts();
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showHeart, setShowHeart] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOwner = user?.id === post.user_id;
  const isVideo = post.content_type === "video";
  const saved = isSaved(post.id, "post");

  // Autoplay video with IntersectionObserver
  useEffect(() => {
    if (!isVideo || !videoRef.current || !containerRef.current) return;

    const video = videoRef.current;
    const container = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0.7] }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isVideo]);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLike = async () => {
    if (!user) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

    try {
      await toggleLike.mutateAsync({
        targetId: post.id,
        targetType: "post",
        isLiked: !newIsLiked,
        ownerId: post.user_id,
      });
    } catch {
      setIsLiked(!newIsLiked);
      setLikesCount((prev) => (newIsLiked ? prev - 1 : prev + 1));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    await toggleSave(post.id, "post");
  };

  const handleVideoTap = useCallback(() => {
    if (!isVideo) return;
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap - like
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
        doubleTapTimeoutRef.current = null;
      }
      
      if (user && !isLiked) {
        handleLike();
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
      }
    } else {
      // Single tap - toggle mute
      doubleTapTimeoutRef.current = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
        }
        doubleTapTimeoutRef.current = null;
      }, 300);
    }

    lastTapRef.current = now;
  }, [isVideo, isMuted, user, isLiked]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Link to={isOwner ? "/dashboard/profile" : `/dashboard/user/${post.user_id}`}>
              <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(post.author?.full_name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                to={isOwner ? "/dashboard/profile" : `/dashboard/user/${post.user_id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {post.author?.full_name || "Unknown User"}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
            {isOwner && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(post.id)}
                  >
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {/* Caption */}
            {post.caption && (
              <p className="text-foreground whitespace-pre-wrap">{post.caption}</p>
            )}

            {/* Media */}
            {post.media_url && (
              <div 
                ref={containerRef}
                className="rounded-xl overflow-hidden bg-secondary/30 relative"
                onClick={handleVideoTap}
              >
                {isVideo ? (
                  <>
                    <video
                      ref={videoRef}
                      src={post.media_url}
                      loop
                      muted={isMuted}
                      playsInline
                      className="w-full max-h-[500px] object-contain cursor-pointer"
                      poster={post.thumbnail_url || undefined}
                    />
                    
                    {/* Double-tap heart animation */}
                    <AnimatePresence>
                      {showHeart && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1.2 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                        >
                          <Heart className="h-20 w-20 text-red-500 fill-red-500 drop-shadow-lg" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Mute indicator */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4 text-white" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-white" />
                      )}
                    </button>
                  </>
                ) : (
                  <img
                    src={post.media_url}
                    alt={post.caption || "Post image"}
                    className="w-full max-h-[500px] object-contain"
                  />
                )}
              </div>
            )}

            {/* Description */}
            {post.description && (
              <p className="text-sm text-muted-foreground">{post.description}</p>
            )}

            {/* Engagement */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={cn(
                    "gap-1.5 hover:text-red-500 transition-colors",
                    isLiked && "text-red-500"
                  )}
                  disabled={!user}
                >
                  <Heart
                    className={cn("h-5 w-5", isLiked && "fill-current")}
                  />
                  <span className="text-sm font-medium">{likesCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="gap-1.5"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{post.comments_count}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShare(true)}
                  className="gap-1.5"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8", saved && "text-primary")}
                onClick={handleSave}
                disabled={!user}
              >
                <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
              </Button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <CommentSection
                targetType="post"
                targetId={post.id}
                ownerId={post.user_id}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        title={post.caption || "Check out this post"}
        url={`${window.location.origin}/dashboard/post/${post.id}`}
        postId={post.id}
      />
    </>
  );
}
