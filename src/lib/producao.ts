export const TIPOS_ORDEM = ['Instalação', 'Impressão'] as const;
export const STATUS_ORDEM = ['Aguardando', 'Em andamento', 'Concluída', 'Cancelada'] as const;
export const PRIORIDADES_ORDEM = ['Baixa', 'Normal', 'Alta', 'Urgente'] as const;

export type TipoOrdem = typeof TIPOS_ORDEM[number];
export type StatusOrdem = typeof STATUS_ORDEM[number];
export type EtapaOrdem = { id?: string; nome: string; concluido: boolean };

export const ETAPAS_PADRAO: Record<TipoOrdem, string[]> = {
  Instalação: ['Preparação', 'Logística', 'Instalação', 'Conferência'],
  Impressão: ['Arte e preparação', 'Impressão', 'Acabamento', 'Conferência'],
};

export function etapasDaOrdem(tipo: TipoOrdem, etapasServico?: string[] | null) {
  const limpas = (etapasServico ?? []).map(etapa => etapa.trim()).filter(Boolean);
  return limpas.length ? limpas : ETAPAS_PADRAO[tipo];
}

export function progressoOrdem(etapas: Pick<EtapaOrdem, 'concluido'>[]) {
  if (!etapas.length) return 0;
  return Math.round(etapas.filter(etapa => etapa.concluido).length / etapas.length * 100);
}

export function podeConcluirOrdem(etapas: Pick<EtapaOrdem, 'concluido'>[]) {
  return etapas.length > 0 && etapas.every(etapa => etapa.concluido);
}

export const DIAS_ALERTA_PRAZO = 3;
export type AlertaPrazo = { tipo: 'atrasada' | 'proxima'; dias: number };

export function diasParaPrazo(dataPrevista: string, hoje: string) {
  const prazo = Date.parse(`${dataPrevista}T00:00:00Z`);
  const referencia = Date.parse(`${hoje}T00:00:00Z`);
  return Math.round((prazo - referencia) / 86_400_000);
}

export function alertaPrazo(dataPrevista: string | null, status: string, hoje: string): AlertaPrazo | null {
  if (!dataPrevista || ['Concluída', 'Cancelada'].includes(status)) return null;
  const dias = diasParaPrazo(dataPrevista, hoje);
  if (dias < 0) return { tipo: 'atrasada', dias: Math.abs(dias) };
  if (dias <= DIAS_ALERTA_PRAZO) return { tipo: 'proxima', dias };
  return null;
}

export function textoAlertaPrazo(alerta: AlertaPrazo) {
  if (alerta.tipo === 'atrasada') return `Atrasada há ${alerta.dias} ${alerta.dias === 1 ? 'dia' : 'dias'}`;
  if (alerta.dias === 0) return 'Vence hoje';
  if (alerta.dias === 1) return 'Vence amanhã';
  return `Vence em ${alerta.dias} dias`;
}

export function ordemAtrasada(dataPrevista: string | null, status: string, hoje: string) {
  return alertaPrazo(dataPrevista, status, hoje)?.tipo === 'atrasada';
}

export function validarOrdem(dados: { tipo: TipoOrdem; descricao: string; local_instalacao: string; etapas: string[] }) {
  if (!dados.descricao.trim()) return 'Informe a descrição da ordem.';
  if (dados.tipo === 'Instalação' && !dados.local_instalacao.trim()) return 'Informe o local da instalação.';
  if (!dados.etapas.length) return 'A ordem precisa de pelo menos uma etapa.';
  return null;
}
