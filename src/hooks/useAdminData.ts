import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mockAdminUsers, mockMentorApplications } from "@/data/mockData";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  is_mentor: boolean;
  is_recruiter: boolean;
  is_investor: boolean;
  created_at: string;
}

interface UserWithRole extends Profile {
  role?: string;
  is_banned?: boolean;
  ban_reason?: string | null;
}

interface MentorApplication {
  id: string;
  user_id: string;
  expertise_areas: string[];
  years_experience: number;
  linkedin_url: string | null;
  bio: string;
  motivation: string;
  status: string;
  admin_feedback: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile?: Profile;
}

interface ContentReport {
  id: string;
  reporter_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  description: string | null;
  status: string;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter?: Profile;
}

interface AdminStats {
  totalUsers: number;
  totalMentors: number;
  totalStartups: number;
  totalJobs: number;
  pendingMentorApplications: number;
  pendingReports: number;
  newUsersThisWeek: number;
}

export function useAdminData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [
        { count: totalUsers },
        { count: totalMentors },
        { count: totalStartups },
        { count: totalJobs },
        { count: pendingMentorApplications },
        { count: pendingReports },
        { count: newUsersThisWeek },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("mentors").select("*", { count: "exact", head: true }).eq("is_verified", true),
        supabase.from("startups").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("mentor_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("content_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo.toISOString()),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalMentors: totalMentors || 0,
        totalStartups: totalStartups || 0,
        totalJobs: totalJobs || 0,
        pendingMentorApplications: pendingMentorApplications || 0,
        pendingReports: pendingReports || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
      } as AdminStats;
    },
    enabled: !!user,
  });

  // Fetch all users with roles
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch roles for all users
      const userIds = profiles.map(p => p.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      return profiles.map(p => ({
        ...p,
        role: roleMap.get(p.id) || "student",
      })) as UserWithRole[];
    },
    enabled: !!user,
  });

  // Fetch pending mentor applications
  const { data: mentorApplications = [], isLoading: loadingApplications } = useQuery({
    queryKey: ["admin", "mentor-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch applicant profiles
      const userIds = data.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(app => ({
        ...app,
        profile: profileMap.get(app.user_id),
      })) as MentorApplication[];
    },
    enabled: !!user,
  });

  // Fetch content reports
  const { data: contentReports = [], isLoading: loadingReports } = useQuery({
    queryKey: ["admin", "content-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch reporter profiles
      const reporterIds = data.map(r => r.reporter_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", reporterIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(report => ({
        ...report,
        reporter: profileMap.get(report.reporter_id),
      })) as ContentReport[];
    },
    enabled: !!user,
  });

  // Approve mentor application
  const approveMentorApplication = useMutation({
    mutationFn: async ({ applicationId, feedback }: { applicationId: string; feedback?: string }) => {
      // Get application details
      const { data: application } = await supabase
        .from("mentor_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (!application) throw new Error("Application not found");

      // Update application status
      const { error: updateError } = await supabase
        .from("mentor_applications")
        .update({
          status: "approved",
          admin_feedback: feedback || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      // Create mentor profile
      const { error: mentorError } = await supabase
        .from("mentors")
        .insert({
          user_id: application.user_id,
          expertise: application.expertise_areas,
          bio: application.bio,
          years_experience: application.years_experience,
          linkedin_url: application.linkedin_url,
          is_verified: true,
          verified_at: new Date().toISOString(),
        });

      if (mentorError) throw mentorError;

      // Update user profile
      await supabase
        .from("profiles")
        .update({ is_mentor: true })
        .eq("id", application.user_id);

      // Notify user
      await supabase.from("notifications").insert({
        user_id: application.user_id,
        type: "mentor_approved",
        title: "Mentor Application Approved!",
        message: "Congratulations! Your mentor application has been approved.",
        actor_id: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Application approved!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Reject mentor application
  const rejectMentorApplication = useMutation({
    mutationFn: async ({ applicationId, feedback }: { applicationId: string; feedback: string }) => {
      const { data: application } = await supabase
        .from("mentor_applications")
        .select("user_id")
        .eq("id", applicationId)
        .single();

      const { error } = await supabase
        .from("mentor_applications")
        .update({
          status: "rejected",
          admin_feedback: feedback,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (error) throw error;

      // Notify user
      if (application) {
        await supabase.from("notifications").insert({
          user_id: application.user_id,
          type: "mentor_rejected",
          title: "Mentor Application Update",
          message: "Your mentor application was not approved at this time.",
          actor_id: user?.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Application rejected" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update user role
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "student" | "innovator" | "startup" | "mentor" | "investor" }) => {
      // First try to update existing role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "Role updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Resolve content report
  const resolveContentReport = useMutation({
    mutationFn: async ({ reportId, status, resolution }: {
      reportId: string;
      status: "resolved" | "dismissed";
      resolution?: string;
    }) => {
      const { error } = await supabase
        .from("content_reports")
        .update({
          status,
          resolution: resolution || null,
          reviewed_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "content-reports"] });
      toast({ title: "Report resolved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Verify startup
  const verifyStartup = useMutation({
    mutationFn: async ({ startupId, isVerified }: { startupId: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from("startups")
        .update({ is_verified: isVerified })
        .eq("id", startupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "startups"] });
      toast({ title: "Startup verification updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Feature startup
  const featureStartup = useMutation({
    mutationFn: async ({ startupId, isFeatured }: { startupId: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from("startups")
        .update({ is_featured: isFeatured })
        .eq("id", startupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "startups"] });
      toast({ title: "Startup feature status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Ban/unban user
  const banUser = useMutation({
    mutationFn: async ({ userId, banned, reason }: { userId: string; banned: boolean; reason?: string }) => {
      const { error } = await supabase.rpc("admin_ban_user", {
        _user_id: userId,
        _banned: banned,
        _reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "User ban status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    stats: (stats && stats.totalUsers > 0)
      ? stats
      : {
          totalUsers: 1248,
          totalMentors: 34,
          totalStartups: 87,
          totalJobs: 56,
          pendingMentorApplications: mockMentorApplications.length,
          pendingReports: 2,
          newUsersThisWeek: 42,
        } as AdminStats,
    users: users.length > 0 ? users : (mockAdminUsers as unknown as UserWithRole[]),
    mentorApplications: mentorApplications.length > 0
      ? mentorApplications
      : (mockMentorApplications as unknown as MentorApplication[]),
    contentReports,
    loadingStats,
    loadingUsers,
    loadingApplications,
    loadingReports,
    approveMentorApplication,
    rejectMentorApplication,
    updateUserRole,
    resolveContentReport,
    verifyStartup,
    featureStartup,
    banUser,
  };
}
