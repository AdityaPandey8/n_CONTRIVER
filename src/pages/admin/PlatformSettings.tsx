import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, UserPlus, Bell, Globe, Server, ToggleLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAdminData } from "@/hooks/useAdminData";

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  icon: typeof Settings;
  defaultEnabled: boolean;
}

const platformToggles: SettingToggle[] = [
  { id: "registration", label: "Open Registration", description: "Allow new users to sign up on the platform", icon: UserPlus, defaultEnabled: true },
  { id: "notifications", label: "Email Notifications", description: "Send email notifications for important events", icon: Bell, defaultEnabled: true },
  { id: "mentor_applications", label: "Mentor Applications", description: "Accept new mentor applications", icon: Shield, defaultEnabled: true },
  { id: "public_api", label: "Public API Access", description: "Allow external API access to public data", icon: Globe, defaultEnabled: false },
  { id: "maintenance", label: "Maintenance Mode", description: "Show maintenance page to non-admin users", icon: Server, defaultEnabled: false },
];

export default function PlatformSettings() {
  const { stats } = useAdminData();
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(platformToggles.map((t) => [t.id, t.defaultEnabled]))
  );

  const handleToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-8 relative">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Settings className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
              <p className="text-muted-foreground mt-1">Configure platform features and behavior</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Health */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Users", value: stats?.totalUsers || 0 },
          { label: "Active Mentors", value: stats?.totalMentors || 0 },
          { label: "Total Startups", value: stats?.totalStartups || 0 },
        ].map((item) => (
          <Card key={item.label} className="border-border/50">
            <CardContent className="p-5 text-center">
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Toggles */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5 text-primary" />
            Feature Toggles
          </CardTitle>
          <CardDescription>Enable or disable platform features (UI preview only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {platformToggles.map((toggle, index) => (
            <motion.div
              key={toggle.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-secondary">
                  <toggle.icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{toggle.label}</p>
                  <p className="text-sm text-muted-foreground">{toggle.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={toggles[toggle.id] ? "default" : "secondary"} className="text-xs">
                  {toggles[toggle.id] ? "Enabled" : "Disabled"}
                </Badge>
                <Switch checked={toggles[toggle.id]} onCheckedChange={() => handleToggle(toggle.id)} />
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
