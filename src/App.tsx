import { Toaster } from "@/components/ui/toaster";
import Talents from "@/pages/dashboard/Talents";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Unauthorized from "./pages/Unauthorized";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import CookiePolicy from "./pages/legal/CookiePolicy";
import DataProtection from "./pages/legal/DataProtection";
import AcceptableUse from "./pages/legal/AcceptableUse";
import About from "./pages/company/About";
import Contact from "./pages/company/Contact";
import Careers from "./pages/company/Careers";
import Partners from "./pages/company/Partners";
import PressKit from "./pages/company/PressKit";
import Pricing from "./pages/company/Pricing";
import HelpCenter from "./pages/resources/HelpCenter";
import Documentation from "./pages/resources/Documentation";
import Community from "./pages/resources/Community";
import Support from "./pages/resources/Support";
import FAQs from "./pages/resources/FAQs";
import Security from "./pages/trust/Security";
import Status from "./pages/trust/Status";
import Accessibility from "./pages/trust/Accessibility";
import UserDashboard from "./pages/dashboard/UserDashboard";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";
import IdeasHub from "./pages/dashboard/IdeasHub";
import MyIdeas from "./pages/dashboard/MyIdeas";
import IdeaWorkspace from "./pages/dashboard/IdeaWorkspace";
import IdeaExplorer from "./pages/dashboard/IdeaExplorer";
import Mentors from "./pages/dashboard/Mentors";
import Hackathons from "./pages/dashboard/Hackathons";
import Startups from "./pages/dashboard/Startups";
import Messages from "./pages/dashboard/Messages";
import SocialFeed from "./pages/dashboard/SocialFeed";
import Shorts from "./pages/dashboard/Shorts";
import Search from "./pages/dashboard/Search";
import Notifications from "./pages/dashboard/Notifications";
import AIMentor from "./pages/dashboard/AIMentor";
import StrategyBuilder from "./pages/dashboard/StrategyBuilder";
import PitchFeedback from "./pages/dashboard/PitchFeedback";
import ContriversAI from "./pages/dashboard/ContriversAI";
import SharedChat from "./pages/share/SharedChat";
import Jobs from "./pages/dashboard/Jobs";
import InvestorConnect from "./pages/dashboard/InvestorConnect";
import InvestorProfile from "./pages/dashboard/InvestorProfile";
import PitchDeckStudio from "./pages/dashboard/PitchDeckStudio";
import Learning from "./pages/dashboard/Learning";
import HackathonDetail from "./pages/dashboard/HackathonDetail";
import StartupProfile from "./pages/dashboard/StartupProfile";
import TalentProfile from "./pages/dashboard/TalentProfile";
import MentorProfile from "./pages/dashboard/MentorProfile";
import JobDetail from "./pages/dashboard/JobDetail";
import NotFound from "./pages/NotFound";
import AdminOverview from "./pages/admin/AdminOverview";
import UserManagement from "./pages/admin/UserManagement";
import MentorApprovals from "./pages/admin/MentorApprovals";
import StartupManagement from "./pages/admin/StartupManagement";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import PlatformSettings from "./pages/admin/PlatformSettings";
import ActivityLog from "./pages/admin/ActivityLog";
import HackathonManagement from "./pages/admin/HackathonManagement";
import JobManagement from "./pages/admin/JobManagement";
import TalentManagement from "./pages/admin/TalentManagement";
import AIControlPanel from "./pages/admin/AIControlPanel";
import MatchEngineControl from "./pages/admin/MatchEngineControl";
import FraudQuality from "./pages/admin/FraudQuality";
import SuccessTracker from "./pages/admin/SuccessTracker";
import IdeaEvolutionAnalytics from "./pages/admin/IdeaEvolutionAnalytics";
import Broadcast from "./pages/admin/Broadcast";
import RealtimeMonitor from "./pages/admin/RealtimeMonitor";
import HackRadarIngestion from "./pages/admin/HackRadarIngestion";
// Frozen for V1 (see src/lib/featureFlags.ts) — components kept & imported
// so routes/components aren't deleted, but rendered via ComingSoon in the
// route table below instead of directly.
import InvestorDashboard from "./pages/dashboard/InvestorDashboard";
import InvestorDiscover from "./pages/dashboard/InvestorDiscover";
import InvestorWatchlist from "./pages/dashboard/InvestorWatchlist";
import InvestorPipeline from "./pages/dashboard/InvestorPipeline";
import InvestorPortfolio from "./pages/dashboard/InvestorPortfolio";
import InvestorInsights from "./pages/dashboard/InvestorInsights";
import MentorDashboard from "./pages/dashboard/MentorDashboard";
import MentorMentees from "./pages/dashboard/MentorMentees";
import MentorSessions from "./pages/dashboard/MentorSessions";
import MentorFeedback from "./pages/dashboard/MentorFeedback";
import MentorResources from "./pages/dashboard/MentorResources";
// Frozen for V1 (see src/lib/featureFlags.ts) — kept & imported, rendered
// via ComingSoon in the route table below instead of directly.
import FounderDashboard from "./pages/dashboard/FounderDashboard";
import FounderFundraising from "./pages/dashboard/FounderFundraising";
import FounderTeam from "./pages/dashboard/FounderTeam";
import FounderAnalytics from "./pages/dashboard/FounderAnalytics";
import FounderTasks from "./pages/dashboard/FounderTasks";
import ComingSoon from "./pages/dashboard/ComingSoon";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="contrivers-theme">
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/data-protection" element={<DataProtection />} />
            <Route path="/acceptable-use" element={<AcceptableUse />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/press" element={<PressKit />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/community" element={<Community />} />
            <Route path="/support" element={<Support />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/security" element={<Security />} />
            <Route path="/status" element={<Status />} />
            <Route path="/accessibility" element={<Accessibility />} />
            <Route path="/share/chat/:slug" element={<SharedChat />} />

            {/* Protected - All authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<UserDashboard />} />
                <Route path="feed" element={<SocialFeed />} />
                <Route path="shorts" element={<Shorts />} />
                <Route path="search" element={<Search />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="ideas" element={<IdeasHub />} />
                <Route path="my-ideas" element={<MyIdeas />} />
                <Route path="workspace/:ideaId" element={<IdeaWorkspace />} />
                <Route path="my-ideas/:ideaId" element={<IdeaWorkspace />} />
                <Route path="idea-explorer" element={<IdeaExplorer />} />

                {/* Contrivers AI Hub */}
                <Route path="ai" element={<ContriversAI />} />
                <Route path="ai/:moduleKey" element={<ContriversAI />} />
                <Route path="ai/:moduleKey/:conversationId" element={<ContriversAI />} />

                {/* Backwards-compatible redirects for the legacy AI routes */}
                <Route path="ai-mentor-legacy" element={<AIMentor />} />
                <Route path="strategy-builder-legacy" element={<StrategyBuilder />} />
                <Route path="mentors" element={<Mentors />} />
                <Route path="hackathons" element={<Hackathons />} />
                <Route path="hackradar" element={<Hackathons />} />
                <Route path="hackradar/:hackathonId" element={<HackathonDetail />} />
                <Route path="startups" element={<ComingSoon title="Startups" description="Startups isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="messages" element={<Messages />} />
                <Route path="ai-mentor" element={<Navigate to="/dashboard/ai/mentor" replace />} />
                <Route path="strategy-builder" element={<Navigate to="/dashboard/ai/strategy" replace />} />
                <Route path="pitch-feedback" element={<Navigate to="/dashboard/ai/pitch_feedback" replace />} />
                <Route path="jobs" element={<ComingSoon title="Jobs" description="Jobs isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="talents" element={<Talents />} />
                <Route path="investor-connect" element={<ComingSoon title="Investor Connect" description="The investor marketplace isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="investor/:investorId" element={<ComingSoon title="Investor Connect" description="The investor marketplace isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="pitch-deck-studio" element={<PitchDeckStudio />} />
                <Route path="learning" element={<Learning />} />
                <Route path="hackathon/:hackathonId" element={<HackathonDetail />} />
                <Route path="startup/:startupId" element={<ComingSoon title="Startups" description="Startups isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="talent/:talentId" element={<TalentProfile />} />
                <Route path="mentor/:mentorId" element={<MentorProfile />} />
                <Route path="job/:jobId" element={<ComingSoon title="Jobs" description="Jobs isn't part of the current version yet. It'll return in a future release." />} />

                {/* Investor — frozen for V1, see src/lib/featureFlags.ts */}
                <Route path="investor" element={<ComingSoon title="Investor Dashboard" description="The Investor Dashboard isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="investor/discover" element={<ComingSoon title="Investor Dashboard" description="The Investor Dashboard isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="investor/watchlist" element={<ComingSoon title="Investor Dashboard" description="The Investor Dashboard isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="investor/pipeline" element={<ComingSoon title="Investor Dashboard" description="The Investor Dashboard isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="investor/portfolio" element={<ComingSoon title="Investor Dashboard" description="The Investor Dashboard isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="investor/insights" element={<ComingSoon title="Investor Dashboard" description="The Investor Dashboard isn't part of the current version yet. It'll return in a future release." />} />

                {/* Mentor */}
                <Route path="mentor" element={<MentorDashboard />} />
                <Route path="mentor/mentees" element={<MentorMentees />} />
                <Route path="mentor/sessions" element={<MentorSessions />} />
                <Route path="mentor/feedback" element={<MentorFeedback />} />
                <Route path="mentor/resources" element={<MentorResources />} />

                {/* Founder — frozen for V1, see src/lib/featureFlags.ts */}
                <Route path="founder" element={<ComingSoon title="Founder Dashboard" description="The Founder Dashboard isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="founder/fundraising" element={<ComingSoon title="Founder Dashboard" description="The Founder Dashboard isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="founder/team" element={<ComingSoon title="Founder Dashboard" description="The Founder Dashboard isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="founder/analytics" element={<ComingSoon title="Founder Dashboard" description="The Founder Dashboard isn't part of the current version yet. It'll return in a future release." />} />
                <Route path="founder/tasks" element={<ComingSoon title="Founder Dashboard" description="The Founder Dashboard isn't part of the current version yet. It'll return in a future release." />} />
              </Route>
            </Route>

            {/* Admin only */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="approvals" element={<MentorApprovals />} />
                <Route path="startups" element={<StartupManagement />} />
                <Route path="hackathons" element={<HackathonManagement />} />
                <Route path="jobs" element={<JobManagement />} />
                <Route path="talents" element={<TalentManagement />} />
                <Route path="activity" element={<ActivityLog />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<PlatformSettings />} />
                <Route path="ai-control" element={<AIControlPanel />} />
                <Route path="match-engine" element={<MatchEngineControl />} />
                <Route path="fraud" element={<FraudQuality />} />
                <Route path="success" element={<SuccessTracker />} />
                <Route path="evolution" element={<IdeaEvolutionAnalytics />} />
                <Route path="broadcast" element={<Broadcast />} />
                <Route path="realtime" element={<RealtimeMonitor />} />
                <Route path="hackradar-ingestion" element={<HackRadarIngestion />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
