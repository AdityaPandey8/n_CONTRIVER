import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Bookmark,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Short } from "@/hooks/useShorts";
import { useLike } from "@/hooks/useLikes";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { useAuth } from "@/contexts/AuthContext";
import { SubscribeButton } from "./SubscribeButton";
import { ShareDialog } from "./ShareDialog";
import { CommentSection } from "./CommentSection";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ShortPlayerProps {
  short: Short;
  isActive: boolean;
  onViewed?: () => void;
}

export function ShortPlayer({ short, isActive, onViewed }: ShortPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const { toggleLike } = useLike();
  const { isSaved, toggleSave } = useSavedPosts();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isLiked, setIsLiked] = useState(short.is_liked || false);
  const [likesCount, setLikesCount] = useState(short.likes_count);
  const [showHeart, setShowHeart] = useState(false);
  
  const lastTapRef = useRef<number>(0);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const viewedRef = useRef(false);

  // Reset viewed ref when short changes
  useEffect(() => {
    viewedRef.current = false;
  }, [short.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
      // Only call onViewed once per short
      if (!viewedRef.current) {
        viewedRef.current = true;
        onViewed?.();
      }
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
    }
  }, [isActive]); // Remove onViewed from dependencies to prevent infinite loop

  const handleLike = useCallback(async () => {
    if (!user) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

    try {
      await toggleLike.mutateAsync({
        targetId: short.id,
        targetType: "short",
        isLiked: !newIsLiked,
        ownerId: short.creator_id,
      });
    } catch {
      setIsLiked(!newIsLiked);
      setLikesCount((prev) => (newIsLiked ? prev - 1 : prev + 1));
    }
  }, [user, isLiked, short.id, short.creator_id, toggleLike]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleTap = useCallback(() => {
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
      // Single tap - toggle mute (after a short delay to check for double tap)
      doubleTapTimeoutRef.current = setTimeout(() => {
        toggleMute();
        doubleTapTimeoutRef.current = null;
      }, 300);
    }

    lastTapRef.current = now;
  }, [user, isLiked, handleLike, toggleMute]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const prog = (video.currentTime / video.duration) * 100;
    setProgress(prog);
  };

  const handleSave = async () => {
    if (!user) return;
    await toggleSave(short.id, "short");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "C";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const saved = isSaved(short.id, "short");

  return (
    <>
      <div 
        className="relative h-full w-full bg-black flex items-center justify-center"
        onClick={handleTap}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={short.video_url}
          loop
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          className="h-full w-full object-contain cursor-pointer"
          poster={short.thumbnail_url || undefined}
        />

        {/* Play/Pause overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
            >
              <div className="p-5 rounded-full bg-white/20 backdrop-blur-sm">
                <Play className="h-12 w-12 text-white fill-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              <Heart className="h-24 w-24 text-red-500 fill-red-500 drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0">
          <Progress value={progress} className="h-1 rounded-none bg-white/20" />
        </div>

        {/* Right side actions */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
          {/* Like */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            disabled={!user}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={cn(
                "p-3 rounded-full bg-black/30 backdrop-blur-sm",
                isLiked && "text-red-500"
              )}
            >
              <Heart
                className={cn("h-7 w-7 text-white", isLiked && "fill-red-500 text-red-500")}
              />
            </div>
            <span className="text-white text-xs font-semibold">
              {formatCount(likesCount)}
            </span>
          </button>

          {/* Comments */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(true);
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <span className="text-white text-xs font-semibold">
              {formatCount(short.comments_count)}
            </span>
          </button>

          {/* Save */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={!user}
            className="flex flex-col items-center gap-1"
          >
            <div className={cn(
              "p-3 rounded-full bg-black/30 backdrop-blur-sm",
              saved && "text-primary"
            )}>
              <Bookmark className={cn("h-7 w-7 text-white", saved && "fill-primary text-primary")} />
            </div>
            <span className="text-white text-xs font-semibold">Save</span>
          </button>

          {/* Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowShare(true);
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm">
              <Share2 className="h-7 w-7 text-white" />
            </div>
            <span className="text-white text-xs font-semibold">Share</span>
          </button>

          {/* Mute toggle */}
          <button onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}>
            <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm">
              {isMuted ? (
                <VolumeX className="h-7 w-7 text-white" />
              ) : (
                <Volume2 className="h-7 w-7 text-white" />
              )}
            </div>
          </button>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-4 left-3 right-16 text-white">
          {/* Creator info */}
          <div className="flex items-center gap-3 mb-3">
            <Link to={`/dashboard/user/${short.creator_id}`} onClick={(e) => e.stopPropagation()}>
              <Avatar className="h-10 w-10 ring-2 ring-white/50">
                <AvatarImage src={short.creator?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(short.creator?.full_name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                to={`/dashboard/user/${short.creator_id}`}
                className="font-semibold text-sm hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                @{short.creator?.full_name?.toLowerCase().replace(/\s+/g, "") || "creator"}
              </Link>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <SubscribeButton creatorId={short.creator_id} size="sm" />
            </div>
          </div>

          {/* Title and description */}
          <h3 className="font-semibold mb-1">{short.title}</h3>
          {short.description && (
            <p className="text-sm text-white/80 line-clamp-2">
              {short.description}
            </p>
          )}

          {/* Category badge */}
          <span className="inline-block mt-2 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium capitalize">
            #{short.category}
          </span>
        </div>
      </div>

      {/* Comments Sheet */}
      <Sheet open={showComments} onOpenChange={setShowComments}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Comments ({short.comments_count})</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100%-60px)]">
            <CommentSection
              targetType="short"
              targetId={short.id}
              ownerId={short.creator_id}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Share Dialog */}
      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        title={short.title}
        url={`${window.location.origin}/dashboard/short/${short.id}`}
        shortId={short.id}
      />
    </>
  );
}
