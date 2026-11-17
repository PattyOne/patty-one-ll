export const TIPOS_AGENDAMENTO = ['Agendamento', 'Reserva de urgência', 'Urgência'] as const;
export type TipoAgendamento = typeof TIPOS_AGENDAMENTO[number];
export type VisaoPlanejamento = 'diario' | 'semanal' | 'mensal';
export type Periodo = { inicio: string; fim: string };

export function hojeISO(agora = new Date()) {
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function dataUTC(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}

export function adicionarDias(iso: string, quantidade: number) {
  const data = dataUTC(iso);
  data.setUTCDate(data.getUTCDate() + quantidade);
  return data.toISOString().slice(0, 10);
}

export function adicionarMeses(iso: string, quantidade: number) {
  const ano = Number(iso.slice(0, 4));
  const mes = Number(iso.slice(5, 7));
  const data = new Date(Date.UTC(ano, mes - 1 + quantidade, 1));
  return data.toISOString().slice(0, 10);
}

export function inicioDaSemana(iso: string) {
  const dia = dataUTC(iso).getUTCDay();
  return adicionarDias(iso, -((dia + 6) % 7));
}

export function periodoDaVisao(anchor: string, visao: VisaoPlanejamento): Periodo {
  if (visao === 'diario') return { inicio: anchor, fim: anchor };
  if (visao === 'semanal') {
    const inicio = inicioDaSemana(anchor);
    return { inicio, fim: adicionarDias(inicio, 6) };
  }
  const primeiroDia = `${anchor.slice(0, 7)}-01`;
  const inicio = inicioDaSemana(primeiroDia);
  return { inicio, fim: adicionarDias(inicio, 41) };
}

export function diasDoPeriodo(periodo: Periodo) {
  const dias: string[] = [];
  let atual = periodo.inicio;
  while (atual <= periodo.fim) {
    dias.push(atual);
    atual = adicionarDias(atual, 1);
  }
  return dias;
}

export type IntervaloAgendamento = {
  data_inicio: string;
  data_fim: string;
  hora_inicio?: string | null;
  hora_fim?: string | null;
};

export function periodosSeSobrepoem(a: IntervaloAgendamento, b: IntervaloAgendamento) {
  if (a.data_inicio > b.data_fim || a.data_fim < b.data_inicio) return false;
  if (!a.hora_inicio || !a.hora_fim || !b.hora_inicio || !b.hora_fim) return true;
  return a.hora_inicio < b.hora_fim && a.hora_fim > b.hora_inicio;
}

export function tiposTemConflito(novo: TipoAgendamento, existente: TipoAgendamento) {
  return !(novo === 'Urgência' && existente === 'Reserva de urgência');
}

export function agendamentosTemConflito(
  novo: IntervaloAgendamento & { tipo: TipoAgendamento },
  existente: IntervaloAgendamento & { tipo: TipoAgendamento },
) {
  return periodosSeSobrepoem(novo, existente) && tiposTemConflito(novo.tipo, existente.tipo);
}

export function eventoNoDia(evento: Pick<IntervaloAgendamento, 'data_inicio' | 'data_fim'>, dia: string) {
  return evento.data_inicio <= dia && evento.data_fim >= dia;
}

export function validarAgendamento(dados: {
  titulo: string;
  data_inicio: string;
  data_fim: string;
  hora_inicio: string;
  hora_fim: string;
  veiculo_id: string;
  equipe: string[];
}) {
  if (!dados.titulo.trim()) return 'Informe o título do agendamento.';
  if (!dados.data_inicio || !dados.data_fim) return 'Informe o período do agendamento.';
  if (dados.data_fim < dados.data_inicio) return 'A data final deve ser igual ou posterior à inicial.';
  if (!dados.hora_inicio !== !dados.hora_fim) return 'Preencha o horário inicial e final, ou deixe ambos vazios.';
  if (dados.hora_inicio && dados.hora_fim <= dados.hora_inicio) return 'O horário final deve ser posterior ao inicial.';
  if (!dados.veiculo_id && !dados.equipe.length) return 'Selecione pelo menos um colaborador ou um veículo.';
  return null;
}

export function horarioCurto(hora?: string | null) {
  return hora ? hora.slice(0, 5) : '';
}

export function tituloDoPeriodo(anchor: string, visao: VisaoPlanejamento) {
  if (visao === 'diario') return dataUTC(anchor).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
  if (visao === 'semanal') {
    const periodo = periodoDaVisao(anchor, visao);
    const inicio = dataUTC(periodo.inicio);
    const fim = dataUTC(periodo.fim);
    const mesmoMes = inicio.getUTCMonth() === fim.getUTCMonth();
    const primeiro = inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: mesmoMes ? undefined : 'short', timeZone: 'UTC' });
    const ultimo = fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
    return `${primeiro} – ${ultimo}`;
  }
  const titulo = dataUTC(`${anchor.slice(0, 7)}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return titulo.charAt(0).toUpperCase() + titulo.slice(1);
}

export const DIAS_SEMANA_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
