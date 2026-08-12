import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, Reply, Send, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useComments, Comment } from "@/hooks/useComments";
import { useLike } from "@/hooks/useLikes";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface CommentSectionProps {
  targetType: "post" | "short";
  targetId: string;
  ownerId: string;
}

export function CommentSection({ targetType, targetId, ownerId }: CommentSectionProps) {
  const { user } = useAuth();
  const { comments, isLoading, addComment, deleteComment } = useComments(targetType, targetId);
  const { toggleLike } = useLike();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim() || !user) return;

    try {
      await addComment.mutateAsync({
        content: content.trim(),
        parentId,
        ownerId: parentId ? undefined : ownerId,
      });
      if (parentId) {
        setReplyContent("");
        setReplyingTo(null);
      } else {
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleLikeComment = async (comment: Comment) => {
    if (!user) return;
    try {
      await toggleLike.mutateAsync({
        targetId: comment.id,
        targetType: "comment",
        isLiked: comment.is_liked || false,
        ownerId: comment.user_id,
      });
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={cn("flex gap-3", isReply && "ml-10")}>
      <Link to={user?.id === comment.user_id ? "/dashboard/profile" : `/dashboard/user/${comment.user_id}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(comment.author?.full_name)}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-secondary/30 rounded-xl px-3 py-2">
          <Link
            to={user?.id === comment.user_id ? "/dashboard/profile" : `/dashboard/user/${comment.user_id}`}
            className="font-medium text-sm text-foreground hover:text-primary transition-colors"
          >
            {comment.author?.full_name || "Unknown User"}
          </Link>
          <p className="text-sm text-foreground/90 mt-0.5">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 px-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          <button
            onClick={() => handleLikeComment(comment)}
            className={cn(
              "text-xs font-medium hover:text-red-500 transition-colors flex items-center gap-1",
              comment.is_liked && "text-red-500"
            )}
            disabled={!user}
          >
            <Heart className={cn("h-3 w-3", comment.is_liked && "fill-current")} />
            {comment.likes_count > 0 && comment.likes_count}
          </button>
          {!isReply && user && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
          )}
          {user?.id === comment.user_id && (
            <button
              onClick={() => deleteComment.mutate(comment.id)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyingTo === comment.id && (
          <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-2 flex gap-2">
            <Input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Reply to ${comment.author?.full_name || "user"}...`}
              className="flex-1 h-9 text-sm bg-secondary/30 border-border/50"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!replyContent.trim() || addComment.isPending}
              className="h-9"
            >
              {addComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4 border-t border-border/50">
      {/* Comment input */}
      {user ? (
        <form onSubmit={(e) => handleSubmit(e)} className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getInitials(user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-secondary/30 border-border/50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newComment.trim() || addComment.isPending}
            >
              {addComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-center text-muted-foreground py-2">
          Sign in to comment
        </p>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
