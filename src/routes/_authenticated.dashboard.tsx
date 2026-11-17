import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowDownRight, ArrowUpRight, Brain, Factory, FileText, Gauge, LayoutGrid, MapPin,
  Percent, Receipt, ShoppingCart, Target, TrendingDown, type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PattyOne" },
      { name: "description", content: "Resumo consolidado do seu planejamento e gestão." },
      { property: "og:title", content: "Dashboard — PattyOne" },
      { property: "og:description", content: "Resumo consolidado do seu planejamento e gestão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Donut({ pct, variant = "light" }: { pct: number; variant?: "light" | "dark" }) {
  const r = 48, c = 2 * Math.PI * r;
  const dark = variant === "dark";
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" className="-rotate-90">
      <circle cx={60} cy={60} r={r} fill="none" strokeWidth={10}
        style={{ stroke: dark ? "hsl(0 0% 100% / 0.2)" : "hsl(var(--border))" }} />
      <circle cx={60} cy={60} r={r} fill="none" strokeWidth={10} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
        style={{ stroke: dark ? "hsl(var(--accent))" : "hsl(var(--primary))" }} />
      <text x={60} y={66} textAnchor="middle" className="rotate-90 origin-center text-lg font-semibold"
        style={{ fill: dark ? "hsl(0 0% 100%)" : "hsl(var(--text-primary))" }}>{pct}%</text>
    </svg>
  );
}

function SectionHeader({ icon: Icon, title, action }: { icon: LucideIcon; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: "danger" | "warning" | "success"; children: ReactNode }) {
  const cls = { danger: "bg-danger/10 text-danger", warning: "bg-warning/15 text-warning", success: "bg-success/10 text-success" }[tone];
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", cls)}>{children}</span>;
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{children}</div>
);

function MiniStat({ icon: Icon, label, value, delta, deltaPositive, meta, progress }: {
  icon: LucideIcon; label: string; value: string; delta?: string; deltaPositive?: boolean; meta?: string; progress?: number;
}) {
  return (
    <Card className="rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-text-primary">{value}</span>
        {delta && (
          <span className={cn("flex items-center text-xs font-medium", deltaPositive ? "text-success" : "text-danger")}>
            {deltaPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{delta}
          </span>
        )}
      </div>
      {meta && <div className="mt-1 text-xs text-text-secondary">{meta}</div>}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 text-right text-[11px] text-text-secondary">{progress}%</div>
        </div>
      )}
    </Card>
  );
}

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05, duration: 0.3 } });

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
          <LayoutGrid className="h-3.5 w-3.5" /> Visão Geral
        </Link>
        <h1 className="mt-1 text-3xl font-semibold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Resumo consolidado do seu planejamento e gestão</p>
      </div>

      <section>
        <SectionHeader icon={Brain} title="Inteligência"
          action={<Link to="/painel-gestao" className="text-sm font-medium text-primary hover:underline">Ver detalhes →</Link>} />
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div {...fade(0)}>
            <Card className="relative h-full overflow-hidden rounded-2xl p-5 shadow-sm">
              <Label>Eficiência Operacional</Label>
              <div className="mt-3 text-3xl font-semibold text-text-primary">R$ 0</div>
              <p className="mt-1 text-xs text-text-secondary">média mensal (últimos 3 meses) por colaborador · 0 ativos</p>
              <div className="mt-4"><StatusBadge tone="danger">Abaixo do esperado</StatusBadge></div>
              <motion.div className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary"
                animate={{ y: [-3, 3, -3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <Gauge className="h-5 w-5" />
              </motion.div>
            </Card>
          </motion.div>
          <motion.div {...fade(1)}>
            <Card className="h-full rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between"><Label>Produção</Label>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Factory className="h-4 w-4" /></span></div>
              <div className="mt-3 space-y-3">
                {[
                  { k: "Hoje", n: "0", v: "R$ 0", danger: false },
                  { k: "Atrasadas", n: "3", v: "R$ 640", danger: true },
                  { k: "Em produção", n: "3", v: "R$ 640", danger: false },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <span className="text-sm text-text-secondary">{r.k}</span>
                    <span className={cn("text-sm font-semibold", r.danger ? "text-danger" : "text-text-primary")}>{r.n} · {r.v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
          <motion.div {...fade(2)}>
            <Card className="h-full rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between"><Label>Mídia OOH</Label>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><MapPin className="h-4 w-4" /></span></div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[["0", "Faces ativas"], ["0%", "Ocupação da bissemana"], ["0", "Contratos ativos"]].map(([v, l]) => (
                  <div key={l}><div className="text-2xl font-semibold text-text-primary">{v}</div><div className="text-[11px] leading-tight text-text-secondary">{l}</div></div>
                ))}
              </div>
              <div className="mt-4"><StatusBadge tone="warning">Cadastre seus pontos</StatusBadge></div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section>
        <SectionHeader icon={Target} title="Progresso de Metas"
          action={<span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-text-primary">17 dias úteis restantes</span>} />
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div {...fade(3)}>
            <Card className="h-full rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <Label>Vendas</Label>
                  <div className="mt-2 text-3xl font-semibold text-text-primary">R$ 30 mil</div>
                  <div className="mt-1 text-sm text-text-secondary">de R$ 118,1 mil</div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger"><TrendingDown className="h-5 w-5" /></span>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-elevated">
                <div className="h-full rounded-full bg-primary" style={{ width: "25%" }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-text-secondary"><span>25% da meta</span><span>Faltam R$ 88,1 mil</span></div>
            </Card>
          </motion.div>
          <motion.div {...fade(4)}>
            <div className="flex h-full items-center justify-between rounded-2xl p-6 shadow-sm"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(217 89% 22%))", color: "hsl(0 0% 100%)" }}>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Recebimento</div>
                <div className="mt-2 text-3xl font-semibold">R$ 15 mil</div>
                <div className="mt-1 text-sm opacity-80">de R$ 133.333</div>
              </div>
              <Donut pct={11} variant="dark" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={FileText} label="Orçamentos" value="R$ 100 mil" meta="meta R$ 329,2 mil" progress={30} />
        <MiniStat icon={ShoppingCart} label="Pedidos" value="4" delta="+4" deltaPositive />
        <MiniStat icon={Percent} label="Conversão" value="30,0%" delta="-15pp" deltaPositive={false} meta="meta 45%" progress={66} />
        <MiniStat icon={Receipt} label="Ticket Médio" value="R$ 7,5 mil" progress={100} />
      </section>
    </div>
  );
}
