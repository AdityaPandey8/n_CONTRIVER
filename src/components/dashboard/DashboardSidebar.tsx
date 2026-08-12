import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Settings, Lightbulb, Users, Trophy, Rocket, MessageSquare, LogOut, Sparkles, Play, Search, Home, Briefcase, UserCheck, Compass, FolderOpen, DollarSign, GraduationCap, Bookmark, BarChart3, Calendar, BookOpen, ClipboardList, TrendingUp, PieChart, Building2, HeartHandshake, Wand2, Radar } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: number;
}

const socialNavItems: NavItem[] = [
  { title: "Home", url: "/dashboard/feed", icon: Home },
  { title: "SeedShorts", url: "/dashboard/shorts", icon: Play },
  { title: "Search", url: "/dashboard/search", icon: Search },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
];

const innovationNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Contrivers AI", url: "/dashboard/ai", icon: Wand2 },
  { title: "My Ideas", url: "/dashboard/my-ideas", icon: FolderOpen },
  { title: "Ideas Hub", url: "/dashboard/ideas", icon: Lightbulb },
  { title: "Investor Connect", url: "/dashboard/investor-connect", icon: DollarSign },
  { title: "Learning", url: "/dashboard/learning", icon: GraduationCap },
];

const communityNavItems: NavItem[] = [
  { title: "Mentors", url: "/dashboard/mentors", icon: Users },
  { title: "Jobs", url: "/dashboard/jobs", icon: Briefcase },
  { title: "Talents", url: "/dashboard/talents", icon: UserCheck },
  { title: "Startups", url: "/dashboard/startups", icon: Rocket },
  { title: "HackRadar", url: "/dashboard/hackradar", icon: Radar },
];

const userNavItems: NavItem[] = [
  { title: "My Profile", url: "/dashboard/profile", icon: User },
];

// Role-specific navs
const investorNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard/investor", icon: LayoutDashboard },
  { title: "Discover Startups", url: "/dashboard/investor/discover", icon: Compass },
  { title: "Watchlist", url: "/dashboard/investor/watchlist", icon: Bookmark },
  { title: "Deal Pipeline", url: "/dashboard/investor/pipeline", icon: BarChart3 },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Portfolio", url: "/dashboard/investor/portfolio", icon: PieChart },
  { title: "Insights", url: "/dashboard/investor/insights", icon: TrendingUp },
  { title: "My Profile", url: "/dashboard/profile", icon: User },
];

const mentorNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard/mentor", icon: LayoutDashboard },
  { title: "My Mentees", url: "/dashboard/mentor/mentees", icon: Users },
  { title: "Sessions", url: "/dashboard/mentor/sessions", icon: Calendar },
  { title: "Feedback", url: "/dashboard/mentor/feedback", icon: ClipboardList },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Resources", url: "/dashboard/mentor/resources", icon: BookOpen },
  { title: "HackRadar", url: "/dashboard/hackradar", icon: Radar },
  { title: "My Profile", url: "/dashboard/profile", icon: User },
];

const founderNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard/founder", icon: LayoutDashboard },
  { title: "My Startup", url: "/dashboard/startups", icon: Building2 },
  { title: "Fundraising", url: "/dashboard/founder/fundraising", icon: DollarSign },
  { title: "Team", url: "/dashboard/founder/team", icon: Users },
  { title: "Analytics", url: "/dashboard/founder/analytics", icon: BarChart3 },
  { title: "Mentorship", url: "/dashboard/mentors", icon: HeartHandshake },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "HackRadar", url: "/dashboard/hackradar", icon: Radar },
  { title: "Tasks", url: "/dashboard/founder/tasks", icon: ClipboardList },
  { title: "My Profile", url: "/dashboard/profile", icon: User },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { state, setOpen, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const { profile, role, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const collapsed = state === "collapsed";

  // Role-specific layout: replaces the default Innovation Hub + Community sections
  const roleNav: NavItem[] | null =
    role === "investor" ? investorNavItems
    : role === "mentor" ? mentorNavItems
    : role === "startup" ? founderNavItems
    : null;
  const roleLabel =
    role === "investor" ? "Investor"
    : role === "mentor" ? "Mentor"
    : role === "startup" ? "Founder"
    : null;

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (url: string) => {
    if (url === "/dashboard") return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        asChild
        isActive={isActive(item.url)}
        tooltip={item.title}
        className={`mx-2 rounded-lg transition-all duration-200 ${isActive(item.url) ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
      >
        <Link to={item.url} onClick={handleNavClick} className="flex items-center gap-3 px-3 py-2.5">
          <div className="relative">
            <item.icon className={`h-5 w-5 ${isActive(item.url) ? "text-sidebar-primary" : ""}`} />
            {item.title === "Messages" && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </div>
          <span className="font-medium flex-1">{item.title}</span>
          {!collapsed && item.title === "Messages" && unreadCount > 0 && (
            <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs px-1.5 py-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-gradient-to-b from-sidebar to-sidebar/95">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 gradient-primary rounded-xl shrink-0 shadow-lg">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-xl text-sidebar-foreground">
              CONTRIVER
            </span>
          )}
        </div>

        {/* Social */}
        <SidebarGroup className="mt-2">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4">
              Social
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>{socialNavItems.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {roleNav ? (
          <SidebarGroup className="mt-4">
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4">
                {roleLabel}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent className="mt-2">
              <SidebarMenu>{roleNav.map(renderNavItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            {/* Innovation Hub */}
            <SidebarGroup className="mt-4">
              {!collapsed && (
                <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4">
                  Innovation Hub
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent className="mt-2">
                <SidebarMenu>{innovationNavItems.map(renderNavItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Community */}
            <SidebarGroup className="mt-4">
              {!collapsed && (
                <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4">
                  Community
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent className="mt-2">
                <SidebarMenu>{communityNavItems.map(renderNavItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* User */}
            <SidebarGroup className="mt-4">
              {!collapsed && (
                <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4">
                  User
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent className="mt-2">
                <SidebarMenu>{userNavItems.map(renderNavItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Settings */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/settings")}
                  tooltip="Settings"
                  className={`mx-2 rounded-lg transition-all duration-200 ${isActive("/dashboard/settings") ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
                >
                  <Link to="/dashboard/settings" onClick={handleNavClick} className="flex items-center gap-3 px-3 py-2.5">
                    <Settings className={`h-5 w-5 ${isActive("/dashboard/settings") ? "text-sidebar-primary" : ""}`} />
                    <span className="font-medium">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border/50 bg-sidebar/80 backdrop-blur-sm p-4">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <Link to="/dashboard/profile" onClick={handleNavClick} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-sidebar-accent">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-sidebar-primary to-primary text-white text-sm font-medium">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize truncate flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {role || "Member"}
                </p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <Button variant="ghost" size="icon" onClick={signOut} className="shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
