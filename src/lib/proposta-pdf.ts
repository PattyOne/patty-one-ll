import { totalItem, totaisVenda, brl, dataBR } from './vendas-calc';
import logoAsset from '@/assets/logo-patty.png.asset.json';

type Doc = {
  tipo: string; numero: number | null; status: string; validade: string | null; vendedor: string | null; condicoes_pagamento: string | null; observacao: string | null; desconto: number; created_at: string;
  empresas: { nome: string; cnpj: string | null } | null;
  cadastros: { nome: string; razao_social: string | null; cpf_cnpj: string | null; contato: string | null; email: string | null; telefone: string | null; celular: string | null; endereco: string | null; numero: string | null; bairro: string | null; cidade: string | null; estado: string | null } | null;
  vendas_itens: { categoria: string; descricao: string; ponto: string | null; periodo_inicio: string | null; periodo_fim: string | null; quantidade: number; valor_unitario: number; desconto: number }[];
};

async function logoDataUrl() {
  try {
    const blob = await (await fetch(logoAsset.url)).blob();
    return await new Promise<string>((ok, err) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = err; r.readAsDataURL(blob); });
  } catch { return null; }
}

export async function gerarPdfVenda(v: Doc) {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([import('jspdf'), import('jspdf-autotable'), logoDataUrl()]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const azul: [number, number, number] = [11, 76, 184];
  const titulo = `${v.tipo === 'proposta' ? 'Proposta comercial' : 'Pedido de venda'} nº ${v.numero ?? ''}`;
  if (logo) pdf.addImage(logo, 'PNG', 14, 10, 22, 22);
  pdf.setFont('helvetica', 'bold').setFontSize(15).setTextColor(...azul).text(titulo, 40, 18);
  pdf.setFont('helvetica', 'normal').setFontSize(9).setTextColor(60);
  pdf.text([v.empresas?.nome ?? '', v.empresas?.cnpj ? `CNPJ ${v.empresas.cnpj}` : '', `Emissão: ${dataBR(v.created_at)}${v.validade ? `   ·   Validade: ${dataBR(v.validade)}` : ''}`].filter(Boolean), 40, 24);
  const c = v.cadastros;
  const endereco = [c?.endereco, c?.numero, c?.bairro, c?.cidade && `${c.cidade}${c.estado ? `/${c.estado}` : ''}`].filter(Boolean).join(', ');
  autoTable(pdf, { startY: 38, theme: 'plain', styles: { fontSize: 9, cellPadding: 1 }, head: [[{ content: 'Cliente', styles: { textColor: azul, fontStyle: 'bold' } }]],
    body: [[c?.razao_social && c.razao_social !== c.nome ? `${c.nome} — ${c.razao_social}` : c?.nome ?? ''], ...(c?.cpf_cnpj ? [[`CPF/CNPJ: ${c.cpf_cnpj}`]] : []), ...(endereco ? [[endereco]] : []),
      ...([c?.contato, c?.telefone || c?.celular, c?.email].some(Boolean) ? [[[c?.contato, c?.telefone || c?.celular, c?.email].filter(Boolean).join('  ·  ')]] : [])] });
  const itens = v.vendas_itens.map(i => [
    i.categoria,
    [i.descricao, i.ponto && `Ponto: ${i.ponto}`, (i.periodo_inicio || i.periodo_fim) && `Período: ${dataBR(i.periodo_inicio)} a ${dataBR(i.periodo_fim)}`].filter(Boolean).join('\n'),
    i.quantidade.toLocaleString('pt-BR'), brl(i.valor_unitario), i.desconto ? brl(i.desconto) : '—', brl(totalItem(i)),
  ]);
  const t = totaisVenda(v.vendas_itens, v.desconto);
  autoTable(pdf, { startY: (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5, head: [['Tipo', 'Descrição', 'Qtd.', 'Valor unit.', 'Desconto', 'Total']], body: itens,
    headStyles: { fillColor: azul, fontSize: 9 }, styles: { fontSize: 9, valign: 'top' }, columnStyles: { 0: { cellWidth: 24 }, 2: { halign: 'right', cellWidth: 14 }, 3: { halign: 'right', cellWidth: 26 }, 4: { halign: 'right', cellWidth: 22 }, 5: { halign: 'right', cellWidth: 26 } },
    foot: [['', '', '', '', 'Subtotal', brl(t.subtotal)], ...(t.desconto ? [['', '', '', '', 'Desconto', `- ${brl(t.desconto)}`]] : []), ['', '', '', '', 'Total', brl(t.total)]],
    footStyles: { fillColor: [240, 244, 250], textColor: 30, halign: 'right', fontStyle: 'bold' } });
  let y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  pdf.setFontSize(9).setTextColor(40);
  for (const [rot, val] of [['Condições de pagamento', v.condicoes_pagamento], ['Vendedor', v.vendedor], ['Observações', v.observacao]] as const) {
    if (!val) continue;
    const linhas = pdf.splitTextToSize(val, 182);
    if (y + 6 + linhas.length * 4 > 285) { pdf.addPage(); y = 15; }
    pdf.setFont('helvetica', 'bold').text(rot, 14, y); pdf.setFont('helvetica', 'normal').text(linhas, 14, y + 4.5); y += 8 + linhas.length * 4;
  }
  pdf.save(`${v.tipo === 'proposta' ? 'Proposta' : 'Pedido'}-${v.numero ?? 'novo'}-${(c?.nome ?? '').replace(/[^\p{L}\d]+/gu, '-')}.pdf`);
}
