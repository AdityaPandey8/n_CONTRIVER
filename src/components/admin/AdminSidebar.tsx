import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Shield, BarChart3, CheckCircle, FileText,
  Rocket, LogOut, ArrowLeft, AlertTriangle, Settings, Activity, Trophy, Bell,
  Briefcase, UserCheck, Brain, Link2, ShieldAlert, TrendingUp, GitBranch, Megaphone, Radio, Radar,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminData } from "@/hooks/useAdminData";

const getAdminNavItems = (stats?: { pendingReports: number; pendingMentorApplications: number }) => [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, badge: 0 },
  { title: "User Management", url: "/admin/users", icon: Users, badge: 0 },
  
  { title: "Mentor Approvals", url: "/admin/approvals", icon: CheckCircle, badge: stats?.pendingMentorApplications || 0 },
  { title: "Startup Management", url: "/admin/startups", icon: Rocket, badge: 0 },
  { title: "Jobs", url: "/admin/jobs", icon: Briefcase, badge: 0 },
  { title: "Talents", url: "/admin/talents", icon: UserCheck, badge: 0 },
  { title: "Hackathons", url: "/admin/hackathons", icon: Trophy, badge: 0 },
  { title: "Activity Log", url: "/admin/activity", icon: Activity, badge: 0 },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3, badge: 0 },
  { title: "Settings", url: "/admin/settings", icon: Settings, badge: 0 },
];

const intelligenceNavItems = [
  { title: "AI Control", url: "/admin/ai-control", icon: Brain },
  { title: "Match Engine", url: "/admin/match-engine", icon: Link2 },
  { title: "Fraud & Quality", url: "/admin/fraud", icon: ShieldAlert },
  { title: "Success Tracker", url: "/admin/success", icon: TrendingUp },
  { title: "Idea Evolution", url: "/admin/evolution", icon: GitBranch },
  { title: "Broadcast", url: "/admin/broadcast", icon: Megaphone },
  { title: "Realtime Monitor", url: "/admin/realtime", icon: Radio },
  { title: "HackRadar Ingestion", url: "/admin/hackradar-ingestion", icon: Radar },
];

export function AdminSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { profile, signOut } = useAuth();
  const { stats } = useAdminData();
  const collapsed = state === "collapsed";
  const adminNavItems = getAdminNavItems(stats);

  const isActive = (url: string) => {
    if (url === "/admin") return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "A";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-gradient-to-b from-sidebar to-sidebar/95">
        <div className="p-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-destructive/90 rounded-xl shrink-0 shadow-lg">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-lg text-sidebar-foreground">ADMIN</span>
              <p className="text-xs text-sidebar-foreground/50">Platform Control</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="User Dashboard" className="mx-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                  <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">User Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Notifications" className="mx-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                  <Link to="/dashboard/notifications" className="flex items-center gap-3 px-3 py-2.5">
                    <Bell className="h-5 w-5" />
                    <span className="font-medium">Notifications</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4">
              Management
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={`mx-2 rounded-lg transition-all duration-200 ${
                      isActive(item.url)
                        ? "bg-destructive/20 text-destructive"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                      <item.icon className={`h-5 w-5 ${isActive(item.url) ? "text-destructive" : ""}`} />
                      <span className="font-medium flex-1">{item.title}</span>
                      {item.badge > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-primary-foreground px-1.5">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4">
              Intelligence
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {intelligenceNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={`mx-2 rounded-lg transition-all duration-200 ${
                      isActive(item.url)
                        ? "bg-primary/15 text-primary"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                      <item.icon className={`h-5 w-5 ${isActive(item.url) ? "text-primary" : ""}`} />
                      <span className="font-medium flex-1">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 bg-sidebar/80 backdrop-blur-sm p-4">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-destructive/30">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-destructive to-destructive/80 text-primary-foreground text-sm font-medium">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {profile?.full_name || "Admin"}
                </p>
                <p className="text-xs text-destructive/80 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Administrator
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} className="shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
