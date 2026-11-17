import { describe, expect, it } from 'vitest';
import { capacidadeNumerica, validarEquipe } from '@/lib/equipes';

const valida = { nome: 'Equipe Alfa', setor: 'Instalação', capacidade_horas_dia: '16', colaboradores: ['pessoa-1'], veiculos: ['veiculo-1'] };

describe('cadastro de equipes do planejamento', () => {
  it('exige o setor da equipe', () => {
    expect(validarEquipe({ ...valida, setor: '' })).toBe('Informe o setor da equipe.');
  });
  it('exige capacidade diária maior que zero', () => {
    expect(validarEquipe({ ...valida, capacidade_horas_dia: '0' })).toBe('A capacidade diária deve ser maior que zero.');
  });
  it('exige pelo menos um colaborador ou veículo', () => {
    expect(validarEquipe({ ...valida, colaboradores: [], veiculos: [] })).toBe('Selecione pelo menos um colaborador ou um veículo.');
  });
  it('aceita equipe com setor, colaborador, veículo e capacidade', () => {
    expect(validarEquipe(valida)).toBeNull();
  });
  it('aceita capacidade diária decimal com vírgula', () => {
    expect(capacidadeNumerica('8,5')).toBe(8.5);
  });
});
