import type { ReactNode } from "react";
import logoPatty from "@/assets/logo-patty.png.asset.json";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <img src={logoPatty.url} alt="Patty Painéis" className="h-12 w-12 shrink-0 rounded-full object-contain" />
            <div>
              <div className="font-semibold text-text-primary">PattyOne</div>
              <div className="text-xs text-text-secondary">Gestão de Mídia e Comunicação Visual</div>
            </div>
          </div>
          <div className="rounded-2xl border bg-surface p-7 shadow-sm">
            <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
            <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(217 89% 22%))" }}
      >
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-accent/35 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-24 top-1/3 h-64 w-64 rotate-12 rounded-3xl bg-accent/15" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-sidebar-primary" style={{ color: "hsl(0 0% 100%)" }}>
          <h2 className="max-w-md text-3xl font-semibold leading-tight">
            Sua mídia no lugar certo, sua gestão na palma da mão.
          </h2>
          <p className="mt-3 max-w-md text-sm opacity-80">
            Comercial, Mídia OOH, Produção e Financeiro em um só lugar.
          </p>
        </div>
      </div>
    </div>
  );
}
