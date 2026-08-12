import { Rocket, Loader2, CheckCircle, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminData } from "@/hooks/useAdminData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mockStartups, isDemoId } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

export default function StartupManagement() {
  const { verifyStartup, featureStartup } = useAdminData();
  const { toast } = useToast();

  const { data: startupsData = [], isLoading } = useQuery({
    queryKey: ["admin", "startups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const startups = startupsData.length > 0 ? startupsData : (mockStartups as unknown as typeof startupsData);
  const blockDemo = (id: string) => {
    if (isDemoId(id)) {
      toast({ title: "Demo entry", description: "This action is disabled for demo data." });
      return true;
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Rocket className="h-6 w-6 text-warning" />
          Startup Management
        </h1>
        <p className="text-muted-foreground mt-1">{startups.length} startups registered</p>
      </div>

      <div className="space-y-3">
        {startups.map((startup) => (
          <Card key={startup.id} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{startup.name}</p>
                    {isDemoId(startup.id) && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Demo</Badge>
                    )}
                    {startup.is_verified && (
                      <Badge className="bg-success/10 text-success border-0 text-xs">Verified</Badge>
                    )}
                    {startup.is_featured && (
                      <Badge className="bg-warning/10 text-warning border-0 text-xs">Featured</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{startup.tagline || startup.description}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{startup.industry}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{startup.stage}</Badge>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={startup.is_verified ? "secondary" : "default"}
                    onClick={() => { if (!blockDemo(startup.id)) verifyStartup.mutate({ startupId: startup.id, isVerified: !startup.is_verified }); }}
                    disabled={verifyStartup.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {startup.is_verified ? "Unverify" : "Verify"}
                  </Button>
                  <Button
                    size="sm"
                    variant={startup.is_featured ? "secondary" : "outline"}
                    onClick={() => { if (!blockDemo(startup.id)) featureStartup.mutate({ startupId: startup.id, isFeatured: !startup.is_featured }); }}
                    disabled={featureStartup.isPending}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    {startup.is_featured ? "Unfeature" : "Feature"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {startups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Rocket className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No startups found</p>
          </div>
        )}
      </div>
    </div>
  );
}
