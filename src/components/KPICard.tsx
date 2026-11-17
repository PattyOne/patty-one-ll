import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KPICard({ label, value, icon: Icon, delta }: { label: string; value: string; icon: LucideIcon; delta?: number }) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-text-secondary">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-text-primary">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta !== undefined && (
        <div className={cn("mt-3 flex items-center gap-1 text-xs font-medium", up ? "text-success" : "text-danger")}>
          {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(delta)}% vs mês anterior
        </div>
      )}
    </Card>
  );
}
