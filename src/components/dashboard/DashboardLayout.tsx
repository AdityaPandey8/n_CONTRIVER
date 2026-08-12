import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

export function DashboardLayout() {
  const location = useLocation();
  const isMessagesRoute = location.pathname === "/dashboard/messages";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        {/* Decorative background elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2" />
        </div>

        <DashboardSidebar />
        <SidebarInset className="flex flex-col flex-1 relative">
          <DashboardHeader />
          <main className={`flex-1 overflow-auto ${isMessagesRoute ? "" : "p-6 sm:p-8"}`}>
            {isMessagesRoute ? (
              <Outlet />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
