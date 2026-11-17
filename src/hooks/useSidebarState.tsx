import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Ctx = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};
const SidebarContext = createContext<Ctx | null>(null);
const KEY = "sidebar:collapsed";

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsedState(localStorage.getItem(KEY) === "true");
  }, []);

  const setCollapsed = useCallback((v: boolean) => {
    localStorage.setItem(KEY, String(v));
    setCollapsedState(v);
  }, []);
  const toggle = useCallback(() => {
    setCollapsedState((c) => {
      localStorage.setItem(KEY, String(!c));
      return !c;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarState() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebarState must be used within SidebarStateProvider");
  return ctx;
}
