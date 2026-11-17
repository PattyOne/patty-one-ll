export const textFields = 'id_sige tipo_pessoa nome razao_social cpf_cnpj ie im vendedor origem contato celular celular2 telefone telefone2 email email2 contato_financeiro telefone_financeiro email_financeiro cep endereco numero complemento bairro cidade estado codigo_municipio tipo_comissao observacao validado'.split(' ');
export const booleanFields = ['is_cliente', 'is_fornecedor', 'is_prestador', 'reter_iss'];
export const numericFields = ['percentual_iss', 'percentual_comissao', 'percentual_servicos'];
export const bankingFields = ['titular', 'banco', 'cod_banco', 'agencia', 'conta'];
export const importFields = [...textFields, ...booleanFields, ...numericFields, ...bankingFields];
export type FormValues = Record<string, string | boolean | number | null>;
export const normalizeHeader = (s: string) => s.replace(/^\uFEFF/, '').trim().toLowerCase();
export function parseBoolean(value: string): boolean | null {
  const s = value.trim().toLowerCase();
  if (!s) return null;
  if (['s', 'sim', 'true'].includes(s)) return true;
  if (['n', 'não', 'nao', 'false'].includes(s)) return false;
  throw new Error(`Booleano inválido: ${value}`);
}
export function parseNumeric(value: string): number | null {
  let s = value.trim();
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!/^[+-]?\d+(\.\d+)?$/.test(s)) throw new Error(`Número inválido: ${value}`);
  const number = Number(s);
  if (!Number.isFinite(number)) throw new Error(`Número inválido: ${value}`);
  return number;
}
export function normalizeRow(raw: Record<string, string>): FormValues {
  const result: FormValues = {};
  for (const [header, value] of Object.entries(raw)) {
    const key = normalizeHeader(header);
    if (!importFields.includes(key)) continue;
    const s = String(value ?? '').trim();
    if (booleanFields.includes(key)) result[key] = parseBoolean(s);
    else if (numericFields.includes(key)) result[key] = parseNumeric(s);
    else if (key === 'validado') result[key] = s ? (parseBoolean(s) ? 'Sim' : 'Não') : null;
    else if (key === 'estado') result[key] = s.toUpperCase() || null;
    else result[key] = s || null;
  }
  return result;
}
export function maskDocument(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14);
  return d.length <= 11 ? d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4') : d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}
export const maskCep = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
export function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(d.length > 10 ? /(\d{5})(\d{1,4})$/ : /(\d{4})(\d{1,4})$/, '$1-$2');
}
export const labels: Record<string, string> = {
  id_sige: 'ID SIGE', tipo_pessoa: 'Tipo de pessoa', nome: 'Nome fantasia / Nome', razao_social: 'Razão social', cpf_cnpj: 'CPF/CNPJ', ie: 'Inscrição estadual', im: 'Inscrição municipal', is_cliente: 'Cliente', is_fornecedor: 'Fornecedor', is_prestador: 'Prestador', vendedor: 'Vendedor', origem: 'Origem', contato: 'Contato', celular: 'Celular', celular2: 'Celular 2', telefone: 'Telefone', telefone2: 'Telefone 2', email: 'E-mail', email2: 'E-mail 2', contato_financeiro: 'Contato financeiro', telefone_financeiro: 'Telefone financeiro', email_financeiro: 'E-mail financeiro', cep: 'CEP', endereco: 'Endereço', numero: 'Número', complemento: 'Complemento', bairro: 'Bairro', cidade: 'Cidade', estado: 'Estado', codigo_municipio: 'Código do município', reter_iss: 'Reter ISS', percentual_iss: 'ISS (%)', tipo_comissao: 'Tipo de comissão', percentual_comissao: 'Comissão (%)', percentual_servicos: 'Serviços (%)', observacao: 'Observação', validado: 'Validado', titular: 'Titular', banco: 'Banco', cod_banco: 'Código do banco', agencia: 'Agência', conta: 'Conta',
};
export const fieldGroups = {
  gerais: ['id_sige', 'tipo_pessoa', 'nome', 'razao_social', 'cpf_cnpj', 'is_cliente', 'is_fornecedor', 'is_prestador', 'vendedor', 'origem', 'validado', 'observacao'],
  contatos: ['contato', 'celular', 'celular2', 'telefone', 'telefone2', 'email', 'email2', 'contato_financeiro', 'telefone_financeiro', 'email_financeiro'],
  endereco: ['cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'codigo_municipio'],
  fiscal: ['ie', 'im', 'reter_iss', 'percentual_iss', 'tipo_comissao', 'percentual_comissao', 'percentual_servicos'],
  bancario: bankingFields,
};