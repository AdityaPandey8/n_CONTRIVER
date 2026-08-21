import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Lightbulb,
  Rocket,
  Users,
  TrendingUp,
  ArrowRight,
  Loader2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPathForRole } from "@/lib/dashboardRoutes";

// Investor and Startup roles are frozen for V1 (see src/lib/featureFlags.ts)
// — not selectable during onboarding. Existing accounts with those roles
// are unaffected; getDashboardPathForRole() routes them to /dashboard.
type RoleOption = {
  id: "student" | "mentor";
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  features: string[];
};

const roleOptions: RoleOption[] = [
  {
    id: "student",
    title: "Student / Innovator",
    description: "Learn, build, and validate your ideas",
    icon: Lightbulb,
    color: "from-blue-500 to-indigo-600",
    features: ["Submit & validate ideas", "Join hackathons", "Connect with mentors"],
  },
  {
    id: "mentor",
    title: "Mentor",
    description: "Guiding the next generation",
    icon: Users,
    color: "from-emerald-500 to-teal-600",
    features: ["Share expertise", "Book sessions", "Build reputation"],
  },
];

export default function Onboarding() {
  const [selectedRole, setSelectedRole] = useState<RoleOption["id"] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateRole, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    const { error } = await updateRole(selectedRole);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set your role. Please try again.",
      });
    } else {
      toast({
        title: "Welcome aboard! 🎉",
        description: `You're all set as a ${roleOptions.find(r => r.id === selectedRole)?.title}.`,
      });
      navigate(getDashboardPathForRole(selectedRole), { replace: true });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 border-b border-border">
        <div className="container max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 gradient-accent rounded-lg">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Innov<span className="text-accent">8</span>
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="container max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Let's personalize your experience
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {profile?.full_name ? `Welcome, ${profile.full_name.split(" ")[0]}!` : "Welcome!"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Tell us about your role to customize your dashboard and features.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {roleOptions.map((role, index) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;

              return (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  onClick={() => setSelectedRole(role.id)}
                  className={`
                    relative p-6 rounded-xl border-2 text-left transition-all duration-300
                    ${isSelected 
                      ? "border-accent bg-accent/5 shadow-lg shadow-accent/10" 
                      : "border-border bg-card hover:border-accent/50 hover:shadow-md"
                    }
                  `}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 w-6 h-6 rounded-full gradient-accent flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-1">{role.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{role.description}</p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {role.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.button>
              );
            })}
          </div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center"
          >
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedRole || isSubmitting}
              className="gradient-accent text-accent-foreground shadow-glow px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
