import { describe, expect, it } from 'vitest';
import Papa from 'papaparse';
import { normalizeRow, parseBoolean, parseNumeric, maskDocument, maskCep, maskPhone } from '@/lib/cadastros-fields';
import { filtersSchema } from '@/lib/cadastros.functions';
describe('Conversões SIGE', () => {
  it('converte S/N, Sim/Não e true/false', () => {
    for (const value of ['S', 'Sim', 'true']) expect(parseBoolean(value)).toBe(true);
    for (const value of ['N', 'Não', 'false']) expect(parseBoolean(value)).toBe(false);
    expect(() => parseBoolean('talvez')).toThrow();
  });
  it('converte vírgula decimal e ponto de milhar', () => { expect(parseNumeric('1.234,50')).toBe(1234.5); expect(parseNumeric('5,00')).toBe(5); expect(() => parseNumeric('x')).toThrow(); });
  it('normaliza cabeçalhos, validado, estado e campos vazios', () => { expect(normalizeRow({ '\uFEFF NOME ': 'Empresa', validado: 'N', estado: 'sp', email: '', is_cliente: 'S', desconhecida: 'x' })).toEqual({ nome: 'Empresa', validado: 'Não', estado: 'SP', email: null, is_cliente: true }); });
  it('preserva aspas, vírgulas e quebras de linha com BOM', () => {
    const parsed = Papa.parse<Record<string, string>>('\uFEFFnome,observacao,is_cliente,percentual_iss\n"Teste, Empresa","linha 1\nlinha 2",S,"5,00"'.replace(/^\uFEFF/, ''), { header: true, delimiter: ',' });
    expect(normalizeRow(parsed.data[0] ?? {})).toEqual({ nome: 'Teste, Empresa', observacao: 'linha 1\nlinha 2', is_cliente: true, percentual_iss: 5 });
  });
  it('formata CPF e CNPJ', () => { expect(maskDocument('12345678901')).toBe('123.456.789-01'); expect(maskDocument('12345678000199')).toBe('12.345.678/0001-99'); });
  it('formata CEP e telefone', () => { expect(maskCep('01310100')).toBe('01310-100'); expect(maskPhone('11987654321')).toBe('(11) 98765-4321'); });
  it('inicia na primeira página e rejeita página zero', () => { expect(filtersSchema.parse({}).pagina).toBe(1); expect(() => filtersSchema.parse({ pagina: 0 })).toThrow(); });
});