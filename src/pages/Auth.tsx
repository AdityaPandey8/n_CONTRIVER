import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Rocket, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { signInSchema, signUpSchema, SignInFormData, SignUpFormData } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardPathForRole } from "@/lib/dashboardRoutes";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { user, signIn, signUp, resetPassword, updatePassword, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const from = (location.state as any)?.from?.pathname;
  const mode = searchParams.get("mode");
  const { role } = useAuth();

  useEffect(() => {
    if (user && mode !== "reset") {
      // Wait until role is fetched before deciding where to redirect
      if (role === null) return;

      const target = from || getDashboardPathForRole(role);
      navigate(target, { replace: true });
    }
  }, [user, role, navigate, from, mode]);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSignIn = async (data: SignInFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message === "Invalid login credentials" 
            ? "Invalid email or password. Please try again." 
            : error.message,
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Please check your internet connection and try again.",
      });
    }
    setIsSubmitting(false);
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.fullName);

    if (error) {
      let message = error.message;
      if (error.message.includes("already registered")) {
        message = "This email is already registered. Please sign in instead.";
      }
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: message,
      });
      setIsSubmitting(false);
      return;
    }

    // Auto sign-in after successful signup
    try {
      const signInResult = await signIn(data.email, data.password);
      
      if (signInResult.error) {
        signInForm.setValue("email", data.email);
        signInForm.setValue("password", data.password);
        setActiveTab("signin");
        toast({
          title: "Account created!",
          description: "Please sign in to continue.",
        });
      } else {
        // If admin mode, assign admin role via SECURITY DEFINER function
        if (isAdminMode) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { error: rpcError } = await supabase.rpc("assign_admin_role", { _user_id: currentUser.id });
            if (rpcError) {
              console.error("Failed to assign admin role:", rpcError);
              toast({
                variant: "destructive",
                title: "Admin role assignment failed",
                description: "Account created but admin role could not be assigned. Please contact support.",
              });
              setIsSubmitting(false);
              return;
            }
            // Mark admin as onboarded — they don't need the role-selection flow
            await supabase.from("profiles").update({ is_onboarded: true }).eq("id", currentUser.id);
            // Refresh auth context so role is picked up immediately
            await refreshAuth();
            // Navigate directly to admin dashboard
            navigate("/admin", { replace: true });
            setIsSubmitting(false);
            return;
          }
        }
        toast({
          title: isAdminMode ? "Admin account created!" : "Welcome to CONTRIVER!",
          description: isAdminMode 
            ? "Your admin account has been created and you're now signed in."
            : "Your account has been created and you're now signed in.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Please check your internet connection and try again.",
      });
    }
    setIsSubmitting(false);
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    const { error } = await resetPassword(data.email);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to send reset link",
        description: error.message,
      });
    } else {
      toast({
        title: "Reset link sent!",
        description: "Check your email for a password reset link.",
      });
      setActiveTab("signin");
    }
    setIsSubmitting(false);
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    const { error } = await updatePassword(data.password);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to reset password",
        description: error.message,
      });
    } else {
      toast({
        title: "Password updated!",
        description: "You can now sign in with your new password.",
      });
      navigate("/auth", { replace: true });
    }
    setIsSubmitting(false);
  };

  // Password reset mode
  if (mode === "reset") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
              <p className="text-muted-foreground mt-1">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...resetPasswordForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {resetPasswordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{resetPasswordForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10"
                    {...resetPasswordForm.register("confirmPassword")}
                  />
                </div>
                {resetPasswordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{resetPasswordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gradient-accent text-accent-foreground shadow-glow"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md"
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="relative">
                <div className="absolute inset-0 gradient-accent rounded-xl blur-lg opacity-60" />
                <div className="relative flex items-center justify-center w-14 h-14 gradient-accent rounded-xl">
                  <Rocket className="w-7 h-7 text-white" />
                </div>
              </div>
              <span className="font-display font-bold text-3xl text-white">
                CONTRIVER
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Where Innovation Meets Opportunity
            </h1>
            <p className="text-lg text-white/70">
              Connect with mentors, launch your startup, and transform your ideas into reality.
            </p>
          </motion.div>

          {/* Floating shapes */}
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-accent/10 blur-3xl animate-float" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full bg-primary/20 blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Back to home */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex items-center justify-center w-10 h-10 gradient-accent rounded-lg">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              CONTRIVER
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* User / Admin Mode Toggle */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Button
                variant={!isAdminMode ? "default" : "outline"}
                size="sm"
                onClick={() => { setIsAdminMode(false); setActiveTab("signin"); }}
                className={!isAdminMode ? "gradient-accent text-accent-foreground" : ""}
              >
                <User className="w-4 h-4 mr-1" />
                User
              </Button>
              <Button
                variant={isAdminMode ? "default" : "outline"}
                size="sm"
                onClick={() => { setIsAdminMode(true); setActiveTab("signin"); }}
                className={isAdminMode ? "gradient-accent text-accent-foreground" : ""}
              >
                <Shield className="w-4 h-4 mr-1" />
                Admin
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">{isAdminMode ? "Admin Sign In" : "Sign In"}</TabsTrigger>
                <TabsTrigger value="signup">{isAdminMode ? "Admin Sign Up" : "Sign Up"}</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="signin" className="mt-0">
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground">
                        {isAdminMode ? "Admin Sign In" : "Welcome back"}
                      </h2>
                      <p className="text-muted-foreground mt-1">
                        {isAdminMode ? "Sign in to the admin dashboard" : "Sign in to continue your journey"}
                      </p>
                    </div>

                    <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="name@example.com"
                            className="pl-10"
                            {...signInForm.register("email")}
                          />
                        </div>
                        {signInForm.formState.errors.email && (
                          <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password">Password</Label>
                          <button
                            type="button"
                            onClick={() => setActiveTab("forgot")}
                            className="text-sm text-accent hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            {...signInForm.register("password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {signInForm.formState.errors.password && (
                          <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full gradient-accent text-accent-foreground shadow-glow"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          isAdminMode ? "Admin Sign In" : "Sign In"
                        )}
                      </Button>
                    </form>
                  </motion.div>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground">
                        {isAdminMode ? "Create Admin Account" : "Create an account"}
                      </h2>
                      <p className="text-muted-foreground mt-1">
                        {isAdminMode ? "Register a new administrator account" : "Start your innovation journey today"}
                      </p>
                    </div>

                    <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="John Doe"
                            className="pl-10"
                            {...signUpForm.register("fullName")}
                          />
                        </div>
                        {signUpForm.formState.errors.fullName && (
                          <p className="text-sm text-destructive">{signUpForm.formState.errors.fullName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="name@example.com"
                            className="pl-10"
                            {...signUpForm.register("email")}
                          />
                        </div>
                        {signUpForm.formState.errors.email && (
                          <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            {...signUpForm.register("password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {signUpForm.formState.errors.password && (
                          <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-confirm"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10"
                            {...signUpForm.register("confirmPassword")}
                          />
                        </div>
                        {signUpForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full gradient-accent text-accent-foreground shadow-glow"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          isAdminMode ? "Create Admin Account" : "Create Account"
                        )}
                      </Button>
                    </form>
                  </motion.div>
                </TabsContent>

                {/* Forgot Password Tab */}
                <TabsContent value="forgot" className="mt-0">
                  <motion.div
                    key="forgot"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground">Forgot password?</h2>
                      <p className="text-muted-foreground mt-1">
                        Enter your email and we'll send you a reset link
                      </p>
                    </div>

                    <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="name@example.com"
                            className="pl-10"
                            {...forgotPasswordForm.register("email")}
                          />
                        </div>
                        {forgotPasswordForm.formState.errors.email && (
                          <p className="text-sm text-destructive">{forgotPasswordForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full gradient-accent text-accent-foreground shadow-glow"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Reset Link"
                        )}
                      </Button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("signin")}
                        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Back to sign in
                      </button>
                    </form>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="text-accent hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-accent hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
