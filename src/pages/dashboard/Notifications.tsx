import { motion } from "framer-motion";
import { formatDistanceToNow, isToday, isThisWeek } from "date-fns";
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck, Trash2, Loader2, UserCheck, Link2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useConnections } from "@/hooks/useConnections";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  subscribe: Bell,
  mention: MessageCircle,
  message: MessageCircle,
  connection_request: UserPlus,
  connection_accepted: UserCheck,
  connection: Link2,
};

const iconColors: Record<string, string> = {
  like: "bg-red-500/10 text-red-500",
  comment: "bg-blue-500/10 text-blue-500",
  follow: "bg-green-500/10 text-green-500",
  subscribe: "bg-purple-500/10 text-purple-500",
  connection_request: "bg-amber-500/10 text-amber-500",
  connection_accepted: "bg-green-500/10 text-green-500",
  connection: "bg-primary/10 text-primary",
  message: "bg-blue-500/10 text-blue-500",
  mention: "bg-violet-500/10 text-violet-500",
};

export default function Notifications() {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { acceptRequest, declineRequest } = useConnections();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.target_type === "profile") return `/dashboard/user/${notification.target_id}`;
    if (notification.target_type === "post") return `/dashboard/post/${notification.target_id}`;
    if (notification.target_type === "short") return `/dashboard/short/${notification.target_id}`;
    if (notification.target_type === "conversation") return `/dashboard/messages`;
    if (notification.target_type === "connection") return `/dashboard/profile`;
    return "#";
  };

  // Group notifications by time
  const groupedNotifications = {
    today: notifications.filter(n => isToday(new Date(n.created_at))),
    thisWeek: notifications.filter(n => !isToday(new Date(n.created_at)) && isThisWeek(new Date(n.created_at))),
    earlier: notifications.filter(n => !isToday(new Date(n.created_at)) && !isThisWeek(new Date(n.created_at))),
  };

  const isConnectionRequest = (notification: Notification) => {
    return notification.title?.toLowerCase().includes("connection request") ||
           notification.message?.toLowerCase().includes("connection request");
  };

  const renderNotification = (notification: Notification) => {
    const Icon = iconMap[notification.type] || Bell;
    const iconColor = iconColors[notification.type] || "bg-muted text-muted-foreground";
    const isConnRequest = isConnectionRequest(notification);

    return (
      <div
        key={notification.id}
        className={cn(
          "flex items-start gap-3 p-4 hover:bg-secondary/30 transition-colors",
          !notification.is_read && "bg-primary/5"
        )}
      >
        <Link to={notification.actor_id ? `/dashboard/user/${notification.actor_id}` : "#"}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={notification.actor?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(notification.actor?.full_name)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={getNotificationLink(notification)}
            onClick={() => !notification.is_read && markAsRead.mutate(notification.id)}
          >
            <p className="text-sm">
              <span className="font-semibold">{notification.actor?.full_name || "Someone"}</span>{" "}
              <span className="text-muted-foreground">{notification.message || notification.title}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </Link>
          
          {/* Connection request actions */}
          {isConnRequest && notification.target_id && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                className="h-8"
                onClick={() => {
                  acceptRequest.mutate(notification.target_id!);
                  markAsRead.mutate(notification.id);
                }}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => {
                  declineRequest.mutate(notification.target_id!);
                  markAsRead.mutate(notification.id);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-full", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => deleteNotification.mutate(notification.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;
    
    return (
      <div key={title}>
        <div className="px-4 py-2 bg-muted/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
        </div>
        <div className="divide-y divide-border/50">
          {items.map(renderNotification)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-card/80 border-border/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              <div>
                {renderGroup("Today", groupedNotifications.today)}
                {renderGroup("This Week", groupedNotifications.thisWeek)}
                {renderGroup("Earlier", groupedNotifications.earlier)}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
