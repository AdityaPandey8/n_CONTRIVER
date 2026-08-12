import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search as SearchIcon, Users, FileText, Play, X, Clock, Rocket, Briefcase, GraduationCap, DollarSign, Trophy, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSearch, useSearchSuggestions } from "@/hooks/useSearch";
import { useNavigateToMessage } from "@/hooks/useNavigateToMessage";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "All", icon: SearchIcon },
  { id: "users", label: "People", icon: Users },
  { id: "startups", label: "Startups", icon: Rocket },
  { id: "investors", label: "Investors", icon: DollarSign },
  { id: "mentors", label: "Mentors", icon: GraduationCap },
  { id: "talents", label: "Talents", icon: Users },
  { id: "hackathons", label: "Hackathons", icon: Trophy },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "shorts", label: "Shorts", icon: Play },
] as const;

type Category = typeof categories[number]["id"];

const roleBadgeColors: Record<string, string> = {
  Mentor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Investor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Startup: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Talent: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  Recruiter: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Student: "bg-muted text-muted-foreground",
  Hackathon: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  Job: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

const typeIcons: Record<string, React.ElementType> = {
  user: Users,
  post: FileText,
  short: Play,
  startup: Rocket,
  investor: DollarSign,
  mentor: GraduationCap,
  talent: Users,
  hackathon: Trophy,
  job: Briefcase,
};

export default function Search() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const { results, isLoading } = useSearch(query, category as any);
  const { recentSearches, addRecentSearch, clearRecentSearches } = useSearchSuggestions();
  const navigate = useNavigate();
  const { navigateToMessage } = useNavigateToMessage();

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    const key = result.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search Input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search people, startups, investors, jobs..."
            className="pl-12 pr-10 h-12 text-base bg-card border-border/50"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                category === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <Card className="bg-card/80 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Recent Searches
              </h3>
              <button onClick={clearRecentSearches} className="text-xs text-primary hover:underline">Clear all</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handleSearch(search)}
                  className="px-3 py-1.5 rounded-full bg-secondary/50 text-sm hover:bg-secondary transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {query && (
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No results found for "{query}"</p>
          ) : category === "all" ? (
            // Grouped display
            Object.entries(groupedResults).map(([type, items]) => (
              <div key={type}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 capitalize flex items-center gap-2">
                  {(() => { const Icon = typeIcons[type] || SearchIcon; return <Icon className="h-4 w-4" />; })()}
                  {type === "user" ? "People" : `${type}s`}
                </h3>
                <div className="space-y-2">
                  {items.map((result) => (
                    <ResultCard key={`${result.type}-${result.id}`} result={result} navigate={navigate} navigateToMessage={navigateToMessage} getInitials={getInitials} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <ResultCard key={`${result.type}-${result.id}`} result={result} navigate={navigate} navigateToMessage={navigateToMessage} getInitials={getInitials} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ result, navigate, navigateToMessage, getInitials }: {
  result: any;
  navigate: (path: string) => void;
  navigateToMessage: (userId: string) => void;
  getInitials: (name: string) => string;
}) {
  return (
    <Card className="bg-card/80 border-border/50 hover:bg-secondary/30 transition-colors">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="cursor-pointer flex items-center gap-3 flex-1 min-w-0" onClick={() => navigate(result.link)}>
          {result.avatar_url ? (
            <Avatar className="h-11 w-11">
              <AvatarImage src={result.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary">{getInitials(result.title)}</AvatarFallback>
            </Avatar>
          ) : result.media_url ? (
            <div className="h-11 w-11 rounded-lg bg-secondary overflow-hidden">
              <img src={result.media_url} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
              {(() => { const Icon = typeIcons[result.type] || SearchIcon; return <Icon className="h-5 w-5 text-primary" />; })()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm">{result.title}</p>
            {result.subtitle && <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {result.roleBadge && (
            <Badge className={cn("text-[10px] px-2 py-0.5", roleBadgeColors[result.roleBadge] || "bg-muted text-muted-foreground")}>
              {result.roleBadge}
            </Badge>
          )}
          {(result.type === "user" || result.type === "mentor" || result.type === "investor" || result.type === "talent") && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigateToMessage(result.id); }}>
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
