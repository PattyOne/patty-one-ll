import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, LogOut, Menu, Moon, Search, Sun, User as UserIcon } from "lucide-react";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth, userInitials } from "@/hooks/useAuth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { allNavItems } from "./nav";

const roundBtn =
  "flex h-10 w-10 items-center justify-center rounded-full border bg-surface text-text-secondary shadow-sm transition-colors hover:text-primary";

export function Topbar() {
  const { setMobileOpen } = useSidebarState();
  const { resolved, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = allNavItems.find((i) => pathname.startsWith(i.to));

  return (
    <header className="flex items-center gap-3 px-4 py-4 md:px-6">
      <button className={`${roundBtn} md:hidden`} onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
        <Menu className="h-5 w-5" />
      </button>
      <nav className="hidden items-center gap-1.5 text-sm sm:flex">
        <Link to="/dashboard" className="text-text-secondary hover:text-primary">Início</Link>
        <ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
        <span className="font-medium text-text-primary">{current?.label ?? "Página"}</span>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            placeholder="Buscar..."
            className="h-10 w-64 rounded-full border bg-surface pl-10 pr-14 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-secondary focus:border-primary"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border bg-surface-elevated px-1.5 py-0.5 text-[10px] text-text-secondary">⌘K</kbd>
        </div>
        <button className={roundBtn} onClick={toggle} aria-label="Alternar tema">
          {resolved === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button className={roundBtn} aria-label="Notificações">
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
              {userInitials(user)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate({ to: "/configuracoes" })}>
              <UserIcon className="mr-2 h-4 w-4" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => { await signOut(); navigate({ to: "/login", replace: true }); }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
