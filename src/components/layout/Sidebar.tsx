import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LogOut, User as UserIcon } from "lucide-react";
import logoPatty from "@/assets/logo-patty.png.asset.json";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth, userDisplayName, userInitials } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navGroups, footerItems, type NavItem } from "./nav";
import { useAdmin } from '@/hooks/useAdmin';

export const SIDEBAR_EXPANDED = 260;
export const SIDEBAR_COLLAPSED = 76;

function NavLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: (() => void) | undefined }) {
  const { pathname } = useLocation();
  const active = pathname === item.to || pathname.startsWith(item.to + "/");
  const Icon = item.icon;
  const link = (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-active text-sidebar-primary shadow-sm"
          : "text-sidebar-secondary hover:bg-sidebar-elevated hover:text-sidebar-primary hover:translate-x-0.5",
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-text" />}
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: (() => void) | undefined }) {
  const { user, signOut } = useAuth();
  const { admin } = useAdmin();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full flex-col text-sidebar-primary">
        <div className={cn("flex items-center gap-3 px-4 py-5", collapsed && "justify-center px-0")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
            <img src={logoPatty.url} alt="Patty Painéis" className="h-9 w-9 rounded-full object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-semibold leading-tight">PattyOne</div>
              <div className="truncate text-[11px] leading-tight text-sidebar-secondary">
                Gestão de Mídia e Comunicação Visual
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {navGroups.map((g) => (
            <div key={g.title}>
              {!collapsed ? (
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-secondary/80">
                  {g.title}
                </div>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-sidebar-elevated" />
              )}
              <div className="space-y-1">
                {g.items.filter(it => !it.adminOnly || admin).map((it) => (
                  <NavLink key={it.to} item={it} collapsed={collapsed} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-sidebar px-3 py-3">
          {footerItems.map((it) => (
            <NavLink key={it.to} item={it} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "mt-2 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-sidebar-elevated",
                  collapsed && "justify-center px-0",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-text text-xs font-semibold text-primary">
                  {userInitials(user)}
                </span>
                {!collapsed && (
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{userDisplayName(user)}</span>
                    <span className="block truncate text-[11px] text-sidebar-secondary">{user?.email}</span>
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-48">
              <DropdownMenuItem onClick={() => { onNavigate?.(); navigate({ to: "/configuracoes" }); }}>
                <UserIcon className="mr-2 h-4 w-4" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebarState();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  useEffect(() => setMobileOpen(false), [pathname, setMobileOpen]);

  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-overlay/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed bottom-4 left-4 top-4 z-50 w-[260px] rounded-2xl bg-sidebar-surface shadow-floating"
              initial={{ x: "-110%" }} animate={{ x: 0 }} exit={{ x: "-110%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <SidebarBody collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  return (
    <>
      <motion.aside
        className="fixed bottom-4 left-4 top-4 z-30 overflow-hidden rounded-2xl bg-sidebar-surface shadow-floating"
        initial={false}
        animate={{ width }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <SidebarBody collapsed={collapsed} />
      </motion.aside>
      <motion.button
        onClick={toggle}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        title="Ctrl/Cmd + B"
        className="fixed top-1/2 z-40 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-surface text-text-primary shadow-floating transition-colors hover:text-primary"
        initial={false}
        animate={{ left: 16 + width - 14 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </motion.button>
    </>
  );
}
