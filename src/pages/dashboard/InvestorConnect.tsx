import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, Users } from "lucide-react";
import { useInvestors, useInvestorMatching, Investor } from "@/hooks/useInvestors";
import { useIdeaWorkspaces } from "@/hooks/useIdeaWorkspace";
import { InvestorCard } from "@/components/investor/InvestorCard";
import { InvestorFilters } from "@/components/investor/InvestorFilters";

export default function InvestorConnect() {
  const { investors, isLoading } = useInvestors();
  const { matchInvestors } = useInvestorMatching();
  const { workspaces } = useIdeaWorkspaces();
  const activeWorkspace = workspaces[0];

  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [matchedInvestors, setMatchedInvestors] = useState<Investor[]>([]);

  const handleMatch = async () => {
    if (!activeWorkspace) return;
    const result = await matchInvestors.mutateAsync({
      domain: activeWorkspace.domain,
      stage: activeWorkspace.stage,
    });
    setMatchedInvestors(result);
  };

  const filtered = investors.filter(inv => {
    if (search && !inv.name.toLowerCase().includes(search.toLowerCase()) && !inv.firm?.toLowerCase().includes(search.toLowerCase())) return false;
    if (domainFilter !== "All" && !inv.focus_domains.includes(domainFilter)) return false;
    if (stageFilter !== "All" && !inv.stage_preference.includes(stageFilter)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Investor Connect
            </h1>
            <p className="text-muted-foreground text-sm">Discover investors and share your pitch</p>
          </div>
          {activeWorkspace && (
            <Button onClick={handleMatch} disabled={matchInvestors.isPending} className="gap-2">
              {matchInvestors.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              Find Matches
            </Button>
          )}
        </div>
      </motion.div>

      {matchedInvestors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Matches for {activeWorkspace?.idea_name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {matchedInvestors.slice(0, 6).map(inv => (
              <InvestorCard key={inv.id} investor={inv} />
            ))}
          </div>
        </div>
      )}

      <InvestorFilters
        search={search}
        onSearchChange={setSearch}
        domainFilter={domainFilter}
        onDomainChange={setDomainFilter}
        stageFilter={stageFilter}
        onStageChange={setStageFilter}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(inv => (
            <InvestorCard key={inv.id} investor={inv} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No investors found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
