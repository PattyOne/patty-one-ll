import { describe, expect, it } from 'vitest';
import { alertaPrazo, etapasDaOrdem, ordemAtrasada, podeConcluirOrdem, progressoOrdem, textoAlertaPrazo, validarOrdem } from '@/lib/producao';

describe('ordens de produção', () => {
  it('usa as quatro etapas padrão de instalação quando o serviço não informa fluxo', () => {
    expect(etapasDaOrdem('Instalação', [])).toEqual(['Preparação', 'Logística', 'Instalação', 'Conferência']);
  });
  it('usa as quatro etapas padrão de impressão quando o serviço não informa fluxo', () => {
    expect(etapasDaOrdem('Impressão', null)).toEqual(['Arte e preparação', 'Impressão', 'Acabamento', 'Conferência']);
  });
  it('preserva as etapas importadas do serviço', () => {
    expect(etapasDaOrdem('Impressão', ['Criação', 'Produção'])).toEqual(['Criação', 'Produção']);
  });
  it('calcula o progresso de duas entre quatro etapas como 50%', () => {
    expect(progressoOrdem([{ concluido: true }, { concluido: true }, { concluido: false }, { concluido: false }])).toBe(50);
  });
  it('não permite concluir com qualquer etapa pendente', () => {
    expect(podeConcluirOrdem([{ concluido: true }, { concluido: false }])).toBe(false);
  });
  it('permite concluir somente quando todas as etapas estão concluídas', () => {
    expect(podeConcluirOrdem([{ concluido: true }, { concluido: true }])).toBe(true);
  });
  it('marca como atrasada uma ordem aberta com previsão anterior a hoje', () => {
    expect(ordemAtrasada('2026-11-14', 'Em andamento', '2026-11-15')).toBe(true);
  });
  it('não marca ordem concluída como atrasada', () => {
    expect(ordemAtrasada('2026-11-14', 'Concluída', '2026-11-15')).toBe(false);
  });
  it('alerta uma ordem atrasada há dois dias', () => {
    expect(alertaPrazo('2026-11-13', 'Em andamento', '2026-11-15')).toEqual({ tipo: 'atrasada', dias: 2 });
  });
  it('alerta uma ordem que vence hoje', () => {
    expect(alertaPrazo('2026-11-15', 'Aguardando', '2026-11-15')).toEqual({ tipo: 'proxima', dias: 0 });
    expect(textoAlertaPrazo({ tipo: 'proxima', dias: 0 })).toBe('Vence hoje');
  });
  it('alerta uma ordem que vence exatamente em três dias', () => {
    expect(alertaPrazo('2026-11-18', 'Aguardando', '2026-11-15')).toEqual({ tipo: 'proxima', dias: 3 });
  });
  it('não alerta uma ordem que vence em quatro dias', () => {
    expect(alertaPrazo('2026-11-19', 'Aguardando', '2026-11-15')).toBeNull();
  });
  it('não alerta ordens concluídas ou canceladas mesmo com prazo vencido', () => {
    expect(alertaPrazo('2026-11-14', 'Concluída', '2026-11-15')).toBeNull();
    expect(alertaPrazo('2026-11-14', 'Cancelada', '2026-11-15')).toBeNull();
  });
  it('exige local para ordem de instalação', () => {
    expect(validarOrdem({ tipo: 'Instalação', descricao: 'Outdoor', local_instalacao: '', etapas: ['Instalação'] })).toBe('Informe o local da instalação.');
  });
  it('não exige local para ordem de impressão', () => {
    expect(validarOrdem({ tipo: 'Impressão', descricao: 'Lona', local_instalacao: '', etapas: ['Impressão'] })).toBeNull();
  });
});
