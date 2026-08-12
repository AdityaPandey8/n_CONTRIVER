import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscribe } from "@/hooks/useFollow";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SubscribeButtonProps {
  creatorId: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function SubscribeButton({
  creatorId,
  className,
  size = "default",
}: SubscribeButtonProps) {
  const { user } = useAuth();
  const { isSubscribed, isLoading: checkingSubscription, subscribe, unsubscribe } = useSubscribe(creatorId);
  const [isLoading, setIsLoading] = useState(false);

  if (!user || user.id === creatorId) return null;

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe.mutateAsync(creatorId);
      } else {
        await subscribe.mutateAsync(creatorId);
      }
    } catch (error) {
      console.error("Subscribe action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSubscription) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isSubscribed ? "outline" : "default"}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        isSubscribed
          ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
          : "bg-red-500 hover:bg-red-600 text-white",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <>
          <BellOff className="h-4 w-4 mr-1.5" />
          Subscribed
        </>
      ) : (
        <>
          <Bell className="h-4 w-4 mr-1.5" />
          Subscribe
        </>
      )}
    </Button>
  );
}
