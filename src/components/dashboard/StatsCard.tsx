import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
  iconColor?: string;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  delay = 0,
  iconColor = "from-primary/20 to-primary/10"
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              {trend && (
                <div className={`flex items-center gap-1.5 text-sm font-medium ${trend.isPositive ? "text-success" : "text-destructive"}`}>
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full ${trend.isPositive ? "bg-success/10" : "bg-destructive/10"}`}>
                    {trend.isPositive ? "↑" : "↓"}
                  </span>
                  <span>{Math.abs(trend.value)}%</span>
                  <span className="text-muted-foreground font-normal">from last month</span>
                </div>
              )}
            </div>
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${iconColor}`}>
              <Icon className="h-7 w-7 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
