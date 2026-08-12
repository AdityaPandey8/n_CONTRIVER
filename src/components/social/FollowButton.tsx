import { useState } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  userId: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function FollowButton({
  userId,
  className,
  variant = "default",
  size = "default",
}: FollowButtonProps) {
  const { user } = useAuth();
  const { isFollowing, checkingFollow, follow, unfollow } = useFollow(userId);
  const [isLoading, setIsLoading] = useState(false);

  if (!user || user.id === userId) return null;

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollow.mutateAsync(userId);
      } else {
        await follow.mutateAsync(userId);
      }
    } catch (error) {
      console.error("Follow action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingFollow) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        isFollowing
          ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
          : "gradient-primary text-primary-foreground",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-1.5" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1.5" />
          Follow
        </>
      )}
    </Button>
  );
}
