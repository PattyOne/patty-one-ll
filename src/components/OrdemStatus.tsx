const STATUS_CLASSE: Record<string, string> = {
  Aguardando: 'bg-surface-elevated text-text-secondary',
  'Em andamento': 'bg-warning/15 text-warning',
  'Concluída': 'bg-success/15 text-success',
  Cancelada: 'bg-danger/10 text-danger',
};
export function OrdemStatus({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSE[status] ?? ''}`}>{status}</span>;
}
