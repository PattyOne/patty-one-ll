import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — PattyOne" },
      { name: "description", content: "Recupere o acesso à sua conta PattyOne." },
      { property: "og:title", content: "Recuperar senha — PattyOne" },
      { property: "og:description", content: "Recupere o acesso à sua conta PattyOne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecuperarPage,
});

function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) { toast.error("Informe um e-mail válido"); return; }
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${window.location.origin}/login` });
    setBusy(false);
    toast("Se o e-mail existir, enviaremos instruções.");
  };
  return (
    <AuthLayout title="Recuperar senha" subtitle="Informe seu e-mail para receber as instruções.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" /></div>
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar instruções
        </Button>
        <p className="text-center text-sm text-text-secondary">
          <Link to="/login" className="font-medium text-primary hover:underline">Voltar para o login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
