import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mockJobs } from "@/data/mockData";

interface Job {
  id: string;
  posted_by: string;
  company_name: string;
  company_logo_url: string | null;
  title: string;
  description: string;
  requirements: string | null;
  location: string;
  work_type: "remote" | "onsite" | "hybrid";
  job_type: "full-time" | "part-time" | "contract" | "internship";
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  skills_required: string[];
  experience_level: "entry" | "mid" | "senior" | "lead" | "executive" | null;
  is_active: boolean;
  applications_count: number;
  views_count: number;
  created_at: string;
  poster?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  resume_url: string | null;
  cover_letter: string | null;
  status: "pending" | "reviewed" | "shortlisted" | "rejected" | "hired";
  created_at: string;
  applicant?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
  job?: Job;
}

export function useJobs(filters?: {
  workType?: string;
  jobType?: string;
  experienceLevel?: string;
  search?: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all active jobs
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", filters],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (filters?.workType && filters.workType !== "all") {
        query = query.eq("work_type", filters.workType);
      }
      if (filters?.jobType && filters.jobType !== "all") {
        query = query.eq("job_type", filters.jobType);
      }
      if (filters?.experienceLevel && filters.experienceLevel !== "all") {
        query = query.eq("experience_level", filters.experienceLevel);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch poster profiles
      const posterIds = [...new Set(data.map(j => j.posted_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", posterIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(job => ({
        ...job,
        poster: profileMap.get(job.posted_by),
      })) as Job[];
    },
  });

  // Fetch my posted jobs (for recruiters)
  const { data: myPostedJobs = [] } = useQuery({
    queryKey: ["jobs", "posted", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("posted_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Job[];
    },
    enabled: !!user,
  });

  // Fetch my job applications
  const { data: myApplications = [] } = useQuery({
    queryKey: ["job-applications", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch job details
      const jobIds = data.map(a => a.job_id);
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .in("id", jobIds);

      const jobMap = new Map(jobsData?.map(j => [j.id, j]) || []);

      return data.map(app => ({
        ...app,
        job: jobMap.get(app.job_id),
      })) as JobApplication[];
    },
    enabled: !!user,
  });

  // Post a job
  const postJob = useMutation({
    mutationFn: async (job: Omit<Job, "id" | "posted_by" | "applications_count" | "views_count" | "created_at" | "poster">) => {
      if (!user) throw new Error("Must be logged in");
      
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          ...job,
          posted_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job posted successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Apply to job
  const applyToJob = useMutation({
    mutationFn: async ({ jobId, resumeUrl, coverLetter }: {
      jobId: string;
      resumeUrl?: string;
      coverLetter?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { data, error } = await supabase
        .from("job_applications")
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          resume_url: resumeUrl || null,
          cover_letter: coverLetter || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify job poster
      const { data: job } = await supabase
        .from("jobs")
        .select("posted_by, title")
        .eq("id", jobId)
        .single();

      if (job) {
        await supabase.from("notifications").insert({
          user_id: job.posted_by,
          type: "job_application",
          title: "New Job Application",
          message: `Someone applied to ${job.title}`,
          actor_id: user.id,
          target_type: "job",
          target_id: jobId,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      toast({ title: "Application submitted!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update application status (for recruiters)
  const updateApplicationStatus = useMutation({
    mutationFn: async ({ applicationId, status }: {
      applicationId: string;
      status: JobApplication["status"];
    }) => {
      const { error } = await supabase
        .from("job_applications")
        .update({ status })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      toast({ title: "Status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Fetch applications for a job (for recruiters)
  const getJobApplications = async (jobId: string): Promise<JobApplication[]> => {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch applicant profiles
    const applicantIds = data.map(a => a.applicant_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, headline")
      .in("id", applicantIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return data.map(app => ({
      ...app,
      applicant: profileMap.get(app.applicant_id),
    })) as JobApplication[];
  };

  // Check if user has applied
  const hasApplied = (jobId: string): boolean => {
    return myApplications.some(a => a.job_id === jobId);
  };

  // Use mock data as fallback when DB is empty
  const displayJobs = jobs.length > 0 ? jobs : mockJobs as unknown as Job[];

  return {
    jobs: displayJobs,
    myPostedJobs,
    myApplications,
    isLoading,
    postJob,
    applyToJob,
    updateApplicationStatus,
    getJobApplications,
    hasApplied,
  };
}
