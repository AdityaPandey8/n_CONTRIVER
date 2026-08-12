import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, DollarSign } from "lucide-react";
import { Investor } from "@/hooks/useInvestors";
import { useNavigate } from "react-router-dom";

interface Props {
  investor: Investor;
  onClick?: () => void;
}

export function InvestorCard({ investor, onClick }: Props) {
  const navigate = useNavigate();

  const formatAmount = (n: number | null) => {
    if (!n) return "N/A";
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/dashboard/investor/${investor.id}`);
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-premium transition-all duration-200 hover:border-primary/20" onClick={handleClick}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {investor.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{investor.name}</h3>
            {investor.firm && <p className="text-xs text-muted-foreground">{investor.firm}</p>}
            {investor.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />{investor.location}
              </p>
            )}
          </div>
          {investor.match_score !== undefined && (
            <Badge variant={investor.match_score >= 70 ? "default" : "secondary"} className="shrink-0">
              {investor.match_score}% match
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          {formatAmount(investor.ticket_size_min)} - {formatAmount(investor.ticket_size_max)}
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {investor.focus_domains.slice(0, 3).map(d => (
            <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
          ))}
          {investor.focus_domains.length > 3 && (
            <Badge variant="outline" className="text-xs">+{investor.focus_domains.length - 3}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
