import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  type: "user" | "post" | "short" | "startup" | "investor" | "mentor" | "talent" | "hackathon" | "job";
  id: string;
  title: string;
  subtitle: string | null;
  avatar_url: string | null;
  media_url: string | null;
  link: string;
  roleBadge?: string;
}

export interface UserSearchResult {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  bio: string | null;
}

type SearchCategory = "all" | "users" | "posts" | "shorts" | "startups" | "investors" | "mentors" | "talents" | "hackathons" | "jobs";

export function useSearch(query: string = "", category: SearchCategory = "all") {
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: results, isLoading, error } = useQuery({
    queryKey: ["search", query, category],
    queryFn: async () => {
      if (!query.trim()) return [];
      const searchResults: SearchResult[] = [];
      const q = query.trim();

      // Search users/people
      if (category === "all" || category === "users") {
        const { data: usersData } = await supabase
          .from("profiles")
          .select("id, full_name, bio, avatar_url, is_mentor, is_investor, is_talent, is_recruiter")
          .or(`full_name.ilike.%${q}%, bio.ilike.%${q}%`)
          .limit(10);

        if (usersData) {
          searchResults.push(
            ...usersData.map((u) => ({
              type: "user" as const,
              id: u.id,
              title: u.full_name || "Unknown User",
              subtitle: u.bio,
              avatar_url: u.avatar_url,
              media_url: null,
              link: `/dashboard/profile`,
              roleBadge: u.is_mentor ? "Mentor" : u.is_investor ? "Investor" : u.is_talent ? "Talent" : u.is_recruiter ? "Recruiter" : "Student",
            }))
          );
        }
      }

      // Search posts
      if (category === "all" || category === "posts") {
        const { data: posts } = await supabase
          .from("posts")
          .select(`id, caption, description, media_url, thumbnail_url, author:profiles!posts_user_id_fkey(full_name, avatar_url)`)
          .eq("is_published", true)
          .or(`caption.ilike.%${q}%, description.ilike.%${q}%`)
          .limit(10);

        if (posts) {
          searchResults.push(
            ...posts.map((p) => ({
              type: "post" as const,
              id: p.id,
              title: p.caption || "Post",
              subtitle: p.author?.full_name || null,
              avatar_url: p.author?.avatar_url || null,
              media_url: p.thumbnail_url || p.media_url,
              link: `/dashboard/feed`,
            }))
          );
        }
      }

      // Search shorts
      if (category === "all" || category === "shorts") {
        const { data: shorts } = await supabase
          .from("shorts")
          .select(`id, title, description, thumbnail_url, creator:profiles!shorts_creator_id_fkey(full_name, avatar_url)`)
          .eq("is_published", true)
          .or(`title.ilike.%${q}%, description.ilike.%${q}%`)
          .limit(10);

        if (shorts) {
          searchResults.push(
            ...shorts.map((s) => ({
              type: "short" as const,
              id: s.id,
              title: s.title,
              subtitle: s.creator?.full_name || null,
              avatar_url: s.creator?.avatar_url || null,
              media_url: s.thumbnail_url,
              link: `/dashboard/shorts`,
            }))
          );
        }
      }

      // Search startups
      if (category === "all" || category === "startups") {
        const { data: startupsData } = await supabase
          .from("startups")
          .select("id, name, tagline, industry, stage, logo_url")
          .or(`name.ilike.%${q}%, tagline.ilike.%${q}%, industry.ilike.%${q}%`)
          .limit(10);

        if (startupsData) {
          searchResults.push(
            ...startupsData.map((s) => ({
              type: "startup" as const,
              id: s.id,
              title: s.name,
              subtitle: `${s.industry} • ${s.stage}`,
              avatar_url: s.logo_url,
              media_url: null,
              link: `/dashboard/startup/${s.id}`,
              roleBadge: "Startup",
            }))
          );
        }
      }

      // Search investors
      if (category === "all" || category === "investors") {
        const { data: investorsData } = await supabase
          .from("investors")
          .select("id, name, firm, bio, avatar_url")
          .or(`name.ilike.%${q}%, firm.ilike.%${q}%`)
          .limit(10);

        if (investorsData) {
          searchResults.push(
            ...investorsData.map((i) => ({
              type: "investor" as const,
              id: i.id,
              title: i.name,
              subtitle: i.firm || "Investor",
              avatar_url: i.avatar_url,
              media_url: null,
              link: `/dashboard/investor/${i.id}`,
              roleBadge: "Investor",
            }))
          );
        }
      }

      // Search mentors
      if (category === "all" || category === "mentors") {
        const { data: mentorsData } = await supabase
          .from("mentors")
          .select("id, bio, expertise, user_id, profile:profiles!mentors_user_id_fkey(full_name, avatar_url)")
          .eq("is_verified", true)
          .limit(10);

        if (mentorsData) {
          const filtered = mentorsData.filter(m => 
            m.profile?.full_name?.toLowerCase().includes(q.toLowerCase()) ||
            m.expertise?.some((e: string) => e.toLowerCase().includes(q.toLowerCase()))
          );
          searchResults.push(
            ...filtered.map((m) => ({
              type: "mentor" as const,
              id: m.id,
              title: m.profile?.full_name || "Mentor",
              subtitle: m.expertise?.slice(0, 2).join(", ") || "Mentor",
              avatar_url: m.profile?.avatar_url || null,
              media_url: null,
              link: `/dashboard/mentor/${m.id}`,
              roleBadge: "Mentor",
            }))
          );
        }
      }

      // Search hackathons
      if (category === "all" || category === "hackathons") {
        const { data: hackathonsData } = await supabase
          .from("hackathons")
          .select("id, title, organizer, status")
          .or(`title.ilike.%${q}%, organizer.ilike.%${q}%`)
          .limit(10);

        if (hackathonsData) {
          searchResults.push(
            ...hackathonsData.map((h) => ({
              type: "hackathon" as const,
              id: h.id,
              title: h.title,
              subtitle: `by ${h.organizer} • ${h.status}`,
              avatar_url: null,
              media_url: null,
              link: `/dashboard/hackathon/${h.id}`,
              roleBadge: "Hackathon",
            }))
          );
        }
      }

      // Search jobs
      if (category === "all" || category === "jobs") {
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("id, title, company_name, location, job_type")
          .eq("is_active", true)
          .or(`title.ilike.%${q}%, company_name.ilike.%${q}%`)
          .limit(10);

        if (jobsData) {
          searchResults.push(
            ...jobsData.map((j) => ({
              type: "job" as const,
              id: j.id,
              title: j.title,
              subtitle: `${j.company_name} • ${j.location}`,
              avatar_url: null,
              media_url: null,
              link: `/dashboard/job/${j.id}`,
              roleBadge: "Job",
            }))
          );
        }
      }

      return searchResults;
    },
    enabled: query.length >= 2,
  });

  // Function to search users for messaging
  const searchUsers = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setUsers([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, bio")
        .or(`full_name.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error searching users:", err);
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  return {
    results: results || [],
    isLoading,
    error,
    searchUsers,
    users,
    isSearching,
  };
}

export function useSearchSuggestions() {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("recent-searches");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent-searches");
  };

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
}
