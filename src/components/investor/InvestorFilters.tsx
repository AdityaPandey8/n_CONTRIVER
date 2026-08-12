import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  domainFilter: string;
  onDomainChange: (v: string) => void;
  stageFilter: string;
  onStageChange: (v: string) => void;
}

const DOMAINS = ["All", "SaaS", "FinTech", "EdTech", "HealthTech", "AI/ML", "E-Commerce", "DeepTech", "CleanTech", "Social Impact", "B2B SaaS", "D2C", "AgriTech"];
const STAGES = ["All", "idea", "validation", "mvp", "pitch", "launch"];

export function InvestorFilters({ search, onSearchChange, domainFilter, onDomainChange, stageFilter, onStageChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search investors..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={domainFilter} onValueChange={onDomainChange}>
        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Domain" /></SelectTrigger>
        <SelectContent>
          {DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={stageFilter} onValueChange={onStageChange}>
        <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Stage" /></SelectTrigger>
        <SelectContent>
          {STAGES.map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Stages" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
