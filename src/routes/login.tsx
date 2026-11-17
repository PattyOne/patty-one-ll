import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().trim().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe sua senha"),
});

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — PattyOne" },
      { name: "description", content: "Acesse sua conta PattyOne." },
      { property: "og:title", content: "Entrar — PattyOne" },
      { property: "og:description", content: "Acesse sua conta PattyOne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) { toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha inválidos" : error.message); return; }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <AuthLayout title="Entrar" subtitle="Acesse sua conta para continuar.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link to="/recuperar-senha" className="text-xs font-medium text-primary hover:underline">Esqueci minha senha</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
        </div>
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Entrar
        </Button>
        <p className="text-center text-sm text-text-secondary">
          Não tem conta? <Link to="/cadastro" className="font-medium text-primary hover:underline">Cadastre-se</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
