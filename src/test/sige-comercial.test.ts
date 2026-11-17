import { describe, expect, it } from 'vitest';
import { prepararHistoricoSige, moedaSige, dataSige } from '@/lib/sige-comercial';

const contrato = '#,Autorização,Contrato,Fantasia,Data,Valor,Valor líquido,Vendedor,Status\n29803,29803,,GNV MECANICA,03/11/2026,"R$ 3.900,00","R$ 3.900,00",ELIZETE,RESERVA';
const reserva = '#,Autorização,Fantasia,Data,Valor,Vendedor,Status\n29803,29803,GNV MECANICA,03/11/2026,"R$ 3.900,00",ELIZETE,RESERVA';
describe('Histórico comercial SIGE', () => {
  it('unifica uma autorização repetida sem perder fontes ou valor líquido', () => {
    const result = prepararHistoricoSige([{ name: 'reservas.csv', content: reserva }, { name: 'contratos.csv', content: contrato }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ chave_sige: 'autorizacao:29803', tipo: 'reserva', valor: 3900, valor_liquido: 3900, empresa_nome: null });
    expect(result[0]?.fontes).toHaveLength(2);
  });
  it('preserva vínculo de autorização explícito sem inventar itens ou empresa', () => {
    const proposta = '#,Orc.,Empresa,Cliente,Data,Total,Status,Autorização\n8576,8576,PATTY PAINEIS LTDA,ELIAS,03/11/2026,"R$ 16.892,14",Gerou contrato,29822';
    const linked = reserva.replaceAll('29803', '29822').replace('GNV MECANICA', 'ELIAS');
    const rows = prepararHistoricoSige([{ name: 'propostas.csv', content: proposta }, { name: 'reservas.csv', content: linked }]);
    expect(rows[1]).toMatchObject({ proposta_numero_sige: '8576', empresa_nome: 'PATTY PAINEIS LTDA', empresa_origem: 'proposta', status_sige: 'RESERVA' });
  });
  it('converte valores e datas originais sem confundir data de criação com vencimento', () => {
    expect(moedaSige('R$ 49.718,70')).toBe(49718.7);
    expect(dataSige('01/06/2020')).toBe('2020-06-01');
    expect(() => dataSige('31/02/2026')).toThrow();
    expect(() => moedaSige('inválido')).toThrow();
  });
  it('recusa registros divergentes sob a mesma autorização', () => {
    expect(() => prepararHistoricoSige([{ name: 'a.csv', content: contrato }, { name: 'b.csv', content: reserva.replace('3.900', '4.900') }])).toThrow('conflitantes');
  });
});