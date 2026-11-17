import { describe, expect, it } from 'vitest';
import { normalizarPlaca, rotuloVeiculo, validarVeiculo } from '@/lib/veiculos';

describe('cadastro de veículos', () => {
  it('exige placa', () => {
    expect(validarVeiculo({ placa: ' ' })).toBe('Informe a placa do veículo.');
  });

  it('normaliza a placa sem apagar o formato histórico', () => {
    expect(normalizarPlaca(' qul1d28 ')).toBe('QUL1D28');
    expect(normalizarPlaca('RTC-9')).toBe('RTC-9');
  });

  it('usa apelido, modelo e placa nas listas de seleção', () => {
    expect(rotuloVeiculo({ apelido: 'Caminhão externa', modelo: '710', placa: 'KDZ-2941' })).toBe('Caminhão externa — KDZ-2941');
    expect(rotuloVeiculo({ modelo: '710', placa: 'KDZ-2941' })).toBe('710 — KDZ-2941');
  });
});
