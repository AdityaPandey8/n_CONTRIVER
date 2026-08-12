import { useState } from "react";
import { Users, Search, Loader2, Ban, ShieldCheck, Eye } from "lucide-react";
import { UserContentViewer } from "@/components/admin/UserContentViewer";
import { UserProfileDrawer } from "@/components/admin/UserProfileDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAdminData } from "@/hooks/useAdminData";
import { formatDistanceToNow } from "date-fns";
import { isDemoId } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const roleColors: Record<string, string> = {
  startup: "bg-rose-500/10 text-rose-600",
  mentor: "bg-emerald-500/10 text-emerald-600",
  student: "bg-violet-500/10 text-violet-600",
  investor: "bg-amber-500/10 text-amber-600",
  innovator: "bg-blue-500/10 text-blue-600",
  admin: "bg-red-500/10 text-red-600",
};

const roles = ["admin", "student", "innovator", "startup", "mentor", "investor"] as const;

export default function UserManagement() {
  const { users, loadingUsers, updateUserRole, banUser } = useAdminData();
  const { toast } = useToast();
  const blockDemo = (id: string) => {
    if (isDemoId(id)) {
      toast({ title: "Demo entry", description: "This action is disabled for demo data." });
      return true;
    }
    return false;
  };
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [banDialog, setBanDialog] = useState<{ open: boolean; userId: string; name: string; isBanned: boolean }>({
    open: false,
    userId: "",
    name: "",
    isBanned: false,
  });
  const [banReason, setBanReason] = useState("");
  const [contentViewer, setContentViewer] = useState<{ open: boolean; userId: string; name: string }>({
    open: false, userId: "", name: "",
  });
  const [drawer, setDrawer] = useState<{ open: boolean; userId: string }>({ open: false, userId: "" });

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleBan = () => {
    if (blockDemo(banDialog.userId)) {
      setBanDialog({ open: false, userId: "", name: "", isBanned: false });
      setBanReason("");
      return;
    }
    banUser.mutate(
      { userId: banDialog.userId, banned: !banDialog.isBanned, reason: banReason || undefined },
      { onSettled: () => { setBanDialog({ open: false, userId: "", name: "", isBanned: false }); setBanReason(""); } }
    );
  };

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-1">{users.length} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role quick chips */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={filterRole === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterRole("all")}>All</Badge>
        {roles.map((r) => (
          <Badge key={r} variant={filterRole === r ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => setFilterRole(r)}>{r}</Badge>
        ))}
      </div>

      {/* Users Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                <Avatar className="h-10 w-10 ring-2 ring-border">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm">
                    {user.full_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground truncate">{user.full_name || "Anonymous"}</p>
                    {isDemoId(user.id) && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Demo</Badge>
                    )}
                    {user.is_banned && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        BANNED
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <span className="text-xs text-muted-foreground hidden md:block">
                  {user.created_at && formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </span>
                <Select
                  value={user.role || "student"}
                  onValueChange={(role) => {
                    if (blockDemo(user.id)) return;
                    updateUserRole.mutate({
                      userId: user.id,
                      role: role as (typeof roles)[number],
                    });
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <Badge className={`${roleColors[user.role || "student"]} border-0 capitalize text-xs`}>
                      {user.role || "student"}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setContentViewer({ open: true, userId: user.id, name: user.full_name || "User" })}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setDrawer({ open: true, userId: user.id })}
                >
                  Preview
                </Button>
                <Button
                  variant={user.is_banned ? "outline" : "destructive"}
                  size="sm"
                  className="shrink-0"
                  onClick={() =>
                    setBanDialog({
                      open: true,
                      userId: user.id,
                      name: user.full_name || "this user",
                      isBanned: !!user.is_banned,
                    })
                  }
                >
                  {user.is_banned ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      Unban
                    </>
                  ) : (
                    <>
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      Ban
                    </>
                  )}
                </Button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No users found</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ban/Unban Confirmation Dialog */}
      <AlertDialog open={banDialog.open} onOpenChange={(open) => !open && setBanDialog({ open: false, userId: "", name: "", isBanned: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {banDialog.isBanned ? "Unban" : "Ban"} {banDialog.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {banDialog.isBanned
                ? "This user will regain access to the platform."
                : "This user will be signed out and unable to access the platform."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!banDialog.isBanned && (
            <Textarea
              placeholder="Reason for ban (optional)..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="mt-2"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              className={banDialog.isBanned ? "" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              {banDialog.isBanned ? "Unban User" : "Ban User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserContentViewer
        userId={contentViewer.userId}
        userName={contentViewer.name}
        open={contentViewer.open}
        onOpenChange={(open) => !open && setContentViewer({ open: false, userId: "", name: "" })}
      />

      <UserProfileDrawer
        userId={drawer.userId}
        open={drawer.open}
        onOpenChange={(open) => !open && setDrawer({ open: false, userId: "" })}
      />
    </div>
  );
}
