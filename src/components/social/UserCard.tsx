import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "./FollowButton";
import { useAuth } from "@/contexts/AuthContext";

interface UserCardProps {
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio?: string | null;
  };
}

export function UserCard({ user: profile }: UserCardProps) {
  const { user: currentUser } = useAuth();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Link to={isOwnProfile ? "/dashboard/profile" : `/dashboard/user/${profile.id}`}>
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              to={isOwnProfile ? "/dashboard/profile" : `/dashboard/user/${profile.id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
            >
              {profile.full_name || "Unknown User"}
            </Link>
            {profile.bio && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {profile.bio}
              </p>
            )}
          </div>
          {!isOwnProfile && <FollowButton userId={profile.id} size="sm" />}
        </div>
      </CardContent>
    </Card>
  );
}
