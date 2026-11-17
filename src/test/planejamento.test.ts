import { describe, expect, it } from 'vitest';
import { adicionarDias, agendamentosTemConflito, diasDoPeriodo, eventoNoDia, inicioDaSemana, periodoDaVisao, periodosSeSobrepoem, validarAgendamento } from '@/lib/planejamento';

describe('planejamento operacional', () => {
  it('usa segunda-feira como início da semana', () => {
    expect(inicioDaSemana('2026-11-15')).toBe('2026-11-09');
    expect(periodoDaVisao('2026-11-15', 'semanal')).toEqual({ inicio: '2026-11-09', fim: '2026-11-15' });
  });
  it('a visão diária consulta somente o dia escolhido', () => {
    expect(periodoDaVisao('2026-11-15', 'diario')).toEqual({ inicio: '2026-11-15', fim: '2026-11-15' });
  });
  it('a visão mensal contém 42 dias e inclui as semanas das bordas', () => {
    const periodo = periodoDaVisao('2026-11-15', 'mensal');
    expect(periodo).toEqual({ inicio: '2026-10-26', fim: '2026-12-06' });
    expect(diasDoPeriodo(periodo)).toHaveLength(42);
  });
  it('considera o agendamento em todos os dias do período, inclusive nas pontas', () => {
    const evento = { data_inicio: '2026-11-16', data_fim: '2026-11-18' };
    expect(eventoNoDia(evento, '2026-11-16')).toBe(true);
    expect(eventoNoDia(evento, '2026-11-17')).toBe(true);
    expect(eventoNoDia(evento, '2026-11-18')).toBe(true);
    expect(eventoNoDia(evento, '2026-11-19')).toBe(false);
  });
  it('não confunde horários consecutivos com conflito', () => {
    expect(periodosSeSobrepoem(
      { data_inicio: '2026-11-16', data_fim: '2026-11-16', hora_inicio: '08:00', hora_fim: '10:00' },
      { data_inicio: '2026-11-16', data_fim: '2026-11-16', hora_inicio: '10:00', hora_fim: '12:00' },
    )).toBe(false);
  });
  it('bloqueia um agendamento comum sobre uma reserva', () => {
    expect(agendamentosTemConflito(
      { tipo: 'Agendamento', data_inicio: '2026-11-16', data_fim: '2026-11-16' },
      { tipo: 'Reserva de urgência', data_inicio: '2026-11-16', data_fim: '2026-11-16' },
    )).toBe(true);
  });
  it('permite que uma urgência utilize uma reserva de urgência', () => {
    expect(agendamentosTemConflito(
      { tipo: 'Urgência', data_inicio: '2026-11-16', data_fim: '2026-11-16', hora_inicio: '08:00', hora_fim: '10:00' },
      { tipo: 'Reserva de urgência', data_inicio: '2026-11-16', data_fim: '2026-11-16', hora_inicio: '08:00', hora_fim: '18:00' },
    )).toBe(false);
  });
  it('não permite urgência sobre outro trabalho agendado', () => {
    expect(agendamentosTemConflito(
      { tipo: 'Urgência', data_inicio: '2026-11-16', data_fim: '2026-11-16' },
      { tipo: 'Agendamento', data_inicio: '2026-11-16', data_fim: '2026-11-16' },
    )).toBe(true);
  });
  it('exige ao menos um colaborador ou veículo', () => {
    expect(validarAgendamento({ titulo: 'Instalação', data_inicio: '2026-11-16', data_fim: '2026-11-16', hora_inicio: '', hora_fim: '', veiculo_id: '', equipe: [] })).toBe('Selecione pelo menos um colaborador ou um veículo.');
  });
  it('aceita reserva somente com veículo', () => {
    expect(validarAgendamento({ titulo: 'Reserva para urgências', data_inicio: '2026-11-16', data_fim: '2026-11-16', hora_inicio: '', hora_fim: '', veiculo_id: 'veiculo-1', equipe: [] })).toBeNull();
  });
  it('avança datas sem sofrer mudança de fuso', () => {
    expect(adicionarDias('2026-11-15', 1)).toBe('2026-11-16');
  });
});
