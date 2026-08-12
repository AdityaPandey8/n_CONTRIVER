import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, UserMinus, UserCheck, Clock, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConnections } from "@/hooks/useConnections";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export interface ConnectButtonProps {
  userId?: string;
  targetUserId?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function ConnectButton({
  userId: userIdProp,
  targetUserId,
  className,
  variant = "default",
  size = "default",
}: ConnectButtonProps) {
  // Support both userId and targetUserId props
  const userId = userIdProp || targetUserId;
  const { user } = useAuth();
  const { 
    getConnectionStatus, 
    sendRequest, 
    cancelRequest, 
    removeConnection,
    connections,
    sentRequests,
  } = useConnections();
  const [isLoading, setIsLoading] = useState(false);

  if (!user || !userId || user.id === userId) return null;

  const status = getConnectionStatus(userId);
  const sentRequest = sentRequests.find(r => r.receiver_id === userId && r.status === "pending");
  const connection = connections.find(c => c.profile?.id === userId);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      switch (status) {
        case "none":
          await sendRequest.mutateAsync({ userId });
          break;
        case "pending_sent":
          if (sentRequest) {
            await cancelRequest.mutateAsync(sentRequest.id);
          }
          break;
        case "connected":
          if (connection) {
            await removeConnection.mutateAsync(connection.id);
          }
          break;
      }
    } catch (error) {
      console.error("Connection action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  switch (status) {
    case "connected":
      return (
        <Button
          variant="outline"
          size={size}
          onClick={handleClick}
          className={cn(
            "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50",
            className
          )}
        >
          <UserCheck className="h-4 w-4 mr-1.5" />
          Connected
        </Button>
      );
    case "pending_sent":
      return (
        <Button
          variant="outline"
          size={size}
          onClick={handleClick}
          className={cn("text-muted-foreground", className)}
        >
          <Clock className="h-4 w-4 mr-1.5" />
          Pending
        </Button>
      );
    case "pending_received":
      return (
        <Button
          variant="default"
          size={size}
          disabled
          className={className}
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Respond
        </Button>
      );
    default:
      return (
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          className={cn("bg-primary text-primary-foreground", className)}
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Connect
        </Button>
      );
  }
}
