const TONS: Record<string, string> = {
  Rascunho: 'bg-surface-elevated text-text-secondary', Enviada: 'bg-primary/10 text-primary', Aprovada: 'bg-success/15 text-success', Recusada: 'bg-danger/10 text-danger',
  Aberto: 'bg-primary/10 text-primary', 'Em andamento': 'bg-warning/15 text-warning', 'Concluído': 'bg-success/15 text-success', Cancelado: 'bg-danger/10 text-danger',
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TONS[status] ?? ''}`}>{status}</span>;
}
