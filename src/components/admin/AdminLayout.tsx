import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useRealtime } from "@/hooks/useRealtime";

export function AdminLayout() {
  const { theme, setTheme } = useTheme();
  useRealtime(true);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <AdminSidebar />
        <SidebarInset className="flex flex-col flex-1 relative">
          <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-4 px-6">
              <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground" />
              <span className="text-sm font-medium text-destructive/80 flex items-center gap-2">
                Admin Panel
              </span>
              <div className="ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 sm:p-8 overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
