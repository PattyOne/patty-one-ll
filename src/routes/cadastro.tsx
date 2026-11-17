import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome"),
    email: z.string().trim().email("Informe um e-mail válido"),
    password: z.string().min(1, "Informe uma senha"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "As senhas não conferem", path: ["confirm"] });

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — PattyOne" },
      { name: "description", content: "Crie sua conta no PattyOne." },
      { property: "og:title", content: "Criar conta — PattyOne" },
      { property: "og:description", content: "Crie sua conta no PattyOne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const navigate = useNavigate();
  const [f, setF] = useState({ nome: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { full_name: parsed.data.nome } },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conta criada! Redirecionando...");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <AuthLayout title="Criar conta" subtitle="Comece a usar o PattyOne em segundos.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="nome">Nome</Label><Input id="nome" value={f.nome} onChange={set("nome")} className="h-11 rounded-xl" /></div>
        <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={f.email} onChange={set("email")} className="h-11 rounded-xl" /></div>
        <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={f.password} onChange={set("password")} className="h-11 rounded-xl" /></div>
        <div className="space-y-2"><Label htmlFor="confirm">Confirmar senha</Label><Input id="confirm" type="password" value={f.confirm} onChange={set("confirm")} className="h-11 rounded-xl" /></div>
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar conta
        </Button>
        <p className="text-center text-sm text-text-secondary">
          Já tem conta? <Link to="/login" className="font-medium text-primary hover:underline">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
