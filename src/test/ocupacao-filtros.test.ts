import { describe, it, expect } from 'vitest';
import {
  alternarStatusFiltro,
  contarPorStatus,
  criarMapaOcupacao,
  filtrarPontos,
  statusDoPonto,
} from '@/lib/ocupacao-filtros';

const pontos = [{ id: 'a', nome: 'A' }, { id: 'b', nome: 'B' }, { id: 'c', nome: 'C' }];
const mapa = criarMapaOcupacao([
  { ponto_id: 'a', bissemana: 5, status: 'Ocupado', cliente: 'Cliente X' },
  { ponto_id: 'b', bissemana: 5, status: 'Reservado', cliente: null },
  { ponto_id: 'a', bissemana: 6, status: 'Livre', cliente: null },
  { ponto_id: 'b', bissemana: 6, status: 'Reservado', cliente: null },
]);

describe('filtros de ocupação por bi-semana', () => {
  it('ponto sem registro na bi-semana é Livre', () => expect(statusDoPonto(mapa, 'c', 5)).toBe('Livre'));
  it('registro com status Livre é Livre', () => expect(statusDoPonto(mapa, 'a', 6)).toBe('Livre'));
  it('filtra só os ocupados da bi-semana 5', () => expect(filtrarPontos(pontos, mapa, 5, ['Ocupado']).map(p => p.id)).toEqual(['a']));
  it('filtra os livres da bi-semana 5', () => expect(filtrarPontos(pontos, mapa, 5, ['Livre']).map(p => p.id)).toEqual(['c']));
  it('combina livres e reservados', () => expect(filtrarPontos(pontos, mapa, 5, ['Livre', 'Reservado']).map(p => p.id)).toEqual(['b', 'c']));
  it('sem status escolhido mostra todos os pontos', () => expect(filtrarPontos(pontos, mapa, 5, []).map(p => p.id)).toEqual(['a', 'b', 'c']));
  it('conta cada situação da bi-semana 5', () => expect(contarPorStatus(pontos, mapa, 5)).toEqual({ Livre: 1, Reservado: 1, Ocupado: 1 }));
  it('conta cada situação da bi-semana 6', () => expect(contarPorStatus(pontos, mapa, 6)).toEqual({ Livre: 2, Reservado: 1, Ocupado: 0 }));
  it('clique no chip acrescenta e depois retira o status', () => {
    expect(alternarStatusFiltro(['Livre'], 'Ocupado')).toEqual(['Livre', 'Ocupado']);
    expect(alternarStatusFiltro(['Livre', 'Ocupado'], 'Livre')).toEqual(['Ocupado']);
  });
});
