import Papa from 'papaparse';

type Raw = Record<string, string>;
export type HistoricoSige = {
  chave_sige: string; tipo: 'proposta' | 'contrato' | 'reserva'; numero_sige: string;
  autorizacao_sige: string | null; contrato_sige: string | null; proposta_numero_sige: string | null;
  cliente_nome: string; empresa_nome: string | null; empresa_origem: 'arquivo' | 'proposta' | null;
  data_documento: string; valor: number; valor_liquido: number | null; vendedor: string | null;
  status_sige: string; tipo_servico: string | null; fontes: string[]; dados_sige: Record<string, Raw>;
};
const text = (value?: string): string | null => value?.trim() && value.trim() !== '-' ? value.trim() : null;
export function moedaSige(value: string): number {
  const clean = value.replace(/R\$|\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) throw new Error(`Valor inválido: ${value}`);
  return Number(clean);
}
export function dataSige(value: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) throw new Error(`Data inválida: ${value}`);
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== iso) throw new Error(`Data inválida: ${value}`);
  return iso;
}
export function prepararHistoricoSige(files: { name: string; content: string }[]): HistoricoSige[] {
  const records = new Map<string, HistoricoSige>();
  for (const file of files) {
    const parsed = Papa.parse<Raw>(file.content.replace(/^\uFEFF/, ''), { header: true, skipEmptyLines: 'greedy' });
    if (parsed.errors.length) throw new Error(`${file.name}: CSV inválido (${parsed.errors[0]?.message}).`);
    const fields = parsed.meta.fields ?? [];
    const proposta = fields.includes('Orc.');
    const contrato = fields.includes('Contrato');
    const required = proposta ? ['#', 'Orc.', 'Empresa', 'Cliente', 'Data', 'Total', 'Status', 'Autorização'] : ['#', 'Autorização', 'Fantasia', 'Data', 'Valor', 'Status'];
    if (required.some(field => !fields.includes(field))) throw new Error(`${file.name}: colunas incompatíveis com o histórico comercial SIGE.`);
    for (const [index, raw] of parsed.data.entries()) {
      const numero = text(proposta ? raw['Orc.'] : raw['Autorização']);
      const cliente = text(proposta ? raw['Cliente'] : raw['Fantasia']);
      const status = text(raw['Status']);
      if (!numero || !/^\d+$/.test(numero) || !cliente || !status) throw new Error(`${file.name}, linha ${index + 2}: número, cliente ou situação inválidos.`);
      const chave = `${proposta ? 'proposta' : 'autorizacao'}:${numero}`;
      const current = records.get(chave);
      const row: HistoricoSige = {
        chave_sige: chave, tipo: proposta ? 'proposta' : status === 'RESERVA' ? 'reserva' : 'contrato', numero_sige: numero,
        autorizacao_sige: proposta ? text(raw['Autorização']) : numero, contrato_sige: contrato ? text(raw['Contrato']) : null,
        proposta_numero_sige: null, cliente_nome: cliente, empresa_nome: proposta ? text(raw['Empresa']) : null,
        empresa_origem: proposta ? 'arquivo' : null, data_documento: dataSige(raw['Data'] ?? ''),
        valor: moedaSige((proposta ? raw['Total'] : raw['Valor']) ?? ''), valor_liquido: contrato ? moedaSige(raw['Valor líquido'] ?? '') : null,
        vendedor: text(raw['Vendedor']), status_sige: status, tipo_servico: proposta ? text(raw['Tipo']) : null,
        fontes: [file.name], dados_sige: { [file.name]: raw },
      };
      if (current) {
        if (current.cliente_nome !== row.cliente_nome || current.data_documento !== row.data_documento || current.valor !== row.valor) throw new Error(`Autorização ${numero}: dados conflitantes entre arquivos.`);
        // Prefer the contract export's richer fields, regardless of upload order.
        const preferred = contrato ? row : current;
        records.set(chave, { ...preferred, fontes: [...new Set([...current.fontes, file.name])], dados_sige: { ...current.dados_sige, ...row.dados_sige } });
      } else records.set(chave, row);
    }
  }
  const rows = [...records.values()];
  for (const row of rows.filter(r => r.tipo !== 'proposta')) {
    const proposals = rows.filter(p => p.tipo === 'proposta' && p.autorizacao_sige === row.numero_sige);
    if (proposals.length === 1) {
      const proposal = proposals[0];
      if (proposal) { row.proposta_numero_sige = proposal.numero_sige; row.empresa_nome = proposal.empresa_nome; row.empresa_origem = 'proposta'; }
    }
  }
  return rows;
}