import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Ctx = { session: Session | null; user: User | null; loading: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function userDisplayName(user: User | null) {
  return (user?.user_metadata?.['full_name'] as string | undefined) || user?.email?.split("@")[0] || "Usuário";
}
export function userInitials(user: User | null) {
  const n = userDisplayName(user).trim().split(/\s+/);
  return ((n[0]?.[0] ?? "") + (n.length > 1 ? (n[n.length - 1]?.[0] ?? "") : "")).toUpperCase() || "U";
}
