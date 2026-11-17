import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar, SIDEBAR_COLLAPSED, SIDEBAR_EXPANDED } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebarState();
  const isMobile = useIsMobile();
  const pl = isMobile ? 0 : (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED) + 32;
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.div initial={false} animate={{ paddingLeft: pl }} transition={{ duration: 0.3, ease: "easeInOut" }}>
        <Topbar />
        <main className="px-4 pb-10 md:px-6">{children}</main>
      </motion.div>
    </div>
  );
}
