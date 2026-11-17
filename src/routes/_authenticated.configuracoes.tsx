import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Monitor, Moon, Sun, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, userDisplayName } from "@/hooks/useAuth";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — PattyOne" },
      { name: "description", content: "Gerencie sua conta e preferências no PattyOne." },
      { property: "og:title", content: "Configurações — PattyOne" },
      { property: "og:description", content: "Gerencie sua conta e preferências no PattyOne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Configuracoes,
});

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Automático", icon: Monitor },
];

function Configuracoes() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setNome(userDisplayName(user)), [user]);

  const save = async () => {
    if (!user) return;
    const full_name = nome.trim();
    if (full_name.length < 2) { toast.error("Informe um nome válido"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name } });
    const { error: e2 } = await supabase.from("profiles").update({ full_name }).eq("id", user.id);
    setSaving(false);
    if (error || e2) { toast.error((error ?? e2)!.message); return; }
    toast.success("Perfil atualizado!");
  };

  const tabCls = "w-full justify-start rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-semibold text-text-primary">Configurações</h1>
      <p className="mt-1 text-sm text-text-secondary">Gerencie sua conta e preferências.</p>
      <Tabs defaultValue="aparencia" orientation="vertical" className="mt-6 flex flex-col gap-6 md:flex-row">
        <TabsList className="flex h-auto w-full flex-col justify-start gap-1 self-start rounded-2xl border bg-surface p-2 shadow-sm md:w-56">
          <TabsTrigger value="aparencia" className={tabCls}>Aparência</TabsTrigger>
          <TabsTrigger value="perfil" className={tabCls}>Perfil</TabsTrigger>
          <TabsTrigger value="conta" className={tabCls}>Conta</TabsTrigger>
        </TabsList>
        <div className="flex-1">
          <TabsContent value="aparencia" className="mt-0">
            <Card className="rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-text-primary">Aparência</h2>
              <p className="text-sm text-text-secondary">Escolha como o PattyOne aparece para você.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {themes.map((t) => (
                  <button key={t.value} onClick={() => setTheme(t.value)}
                    className={cn("flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-colors",
                      theme === t.value ? "border-primary bg-primary/5 text-primary" : "border-border text-text-secondary hover:border-primary/40")}>
                    <t.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="perfil" className="mt-0">
            <Card className="space-y-4 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-text-primary">Perfil</h2>
              <div className="space-y-2"><Label htmlFor="nome">Nome</Label><Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" value={user?.email ?? ""} disabled className="rounded-xl" /></div>
              <Button onClick={save} disabled={saving} className="rounded-xl">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar alterações
              </Button>
            </Card>
          </TabsContent>
          <TabsContent value="conta" className="mt-0">
            <Card className="rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-text-primary">Conta</h2>
              <p className="mb-4 text-sm text-text-secondary">Encerrar a sessão neste dispositivo.</p>
              <Button variant="destructive" className="rounded-xl"
                onClick={async () => { await signOut(); navigate({ to: "/login", replace: true }); }}>
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
