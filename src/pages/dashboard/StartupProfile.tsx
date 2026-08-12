import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket, ArrowLeft, MessageSquare, Users, DollarSign, TrendingUp, Globe, MapPin, Briefcase, Shield, Star, Loader2, ExternalLink, Bookmark, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStartups } from "@/hooks/useStartups";
import { useNavigateToMessage } from "@/hooks/useNavigateToMessage";
import { useAuth } from "@/contexts/AuthContext";
import { ConnectButton } from "@/components/connections/ConnectButton";
import { formatDistanceToNow } from "date-fns";

const getStageColor = (stage: string) => {
  switch (stage?.toLowerCase()) {
    case "idea": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "mvp": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "growth": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "scaling": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default: return "bg-muted text-muted-foreground";
  }
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return "N/A";
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

export default function StartupProfile() {
  const { startupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startups, isLoading } = useStartups();
  const { navigateToMessage } = useNavigateToMessage();

  const startup = startups.find(s => s.id === startupId);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!startup) {
    return (
      <div className="text-center py-20">
        <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Startup not found</h2>
        <Button variant="link" onClick={() => navigate("/dashboard/startups")}>Back to Startups</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/startups")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Startups
      </Button>

      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Avatar className="h-20 w-20 rounded-2xl ring-2 ring-primary/10">
                <AvatarImage src={startup.logo_url || undefined} className="rounded-2xl" />
                <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-white text-2xl font-bold">
                  {startup.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getStageColor(startup.stage)}>{startup.stage}</Badge>
                  <Badge variant="outline">{startup.industry}</Badge>
                  {startup.seeking_investment && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
                      <TrendingUp className="h-3 w-3" /> Seeking Investment
                    </Badge>
                  )}
                  {startup.is_verified && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
                      <Shield className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-foreground">{startup.name}</h1>
                <p className="text-muted-foreground">{startup.tagline || "Innovation in progress"}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={() => navigateToMessage(startup.founder_id)} className="gap-2">
                <MessageSquare className="h-4 w-4" /> Message Founder
              </Button>
              <ConnectButton targetUserId={startup.founder_id} />
              <Button variant="outline" size="icon"><Bookmark className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
              {startup.website_url && (
                <Button variant="outline" asChild className="gap-2">
                  <a href={startup.website_url} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" /> Website</a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs Content */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="traction">Traction</TabsTrigger>
            <TabsTrigger value="funding">Funding</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle>About</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{startup.description}</p>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{startup.user_count || 0}</p><p className="text-xs text-muted-foreground">Users</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><DollarSign className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{formatCurrency(startup.amount_raised)}</p><p className="text-xs text-muted-foreground">Raised</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{startup.growth_rate || "N/A"}</p><p className="text-xs text-muted-foreground">Growth</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><Briefcase className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{startup.stage}</p><p className="text-xs text-muted-foreground">Stage</p></CardContent></Card>
            </div>

            {startup.created_at && (
              <p className="text-sm text-muted-foreground">Founded {formatDistanceToNow(new Date(startup.created_at), { addSuffix: true })}</p>
            )}
          </TabsContent>

          <TabsContent value="traction" className="mt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle>Traction Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="text-2xl font-bold">{startup.user_count?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(startup.revenue)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Growth Rate</p>
                    <p className="text-2xl font-bold">{startup.growth_rate || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funding" className="mt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle>Funding Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Funding Status</p>
                    <p className="text-lg font-semibold">{startup.funding_status || startup.stage}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Amount Raised</p>
                    <p className="text-lg font-semibold">{formatCurrency(startup.amount_raised)}</p>
                  </div>
                </div>
                {startup.seeking_investment && (
                  <div className="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Seeking {formatCurrency(startup.investment_amount_sought)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
