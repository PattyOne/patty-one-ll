import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { fieldGroups, labels, booleanFields, numericFields, bankingFields, maskCep, maskDocument, maskPhone, parseNumeric, type FormValues } from '@/lib/cadastros-fields';
import type { getCadastro } from '@/lib/cadastros.functions';
type Detail = Awaited<ReturnType<typeof getCadastro>>;
const options: Record<string, string[]> = { tipo_pessoa: ['Pessoa Jurídica', 'Pessoa Física'], validado: ['Sim', 'Não'], tipo_comissao: ['Nenhuma', 'Comissão como Agência', 'Comissão como Representante', 'Comissão de aluguel'] };
export function CadastroForm({ data, id }: { data: Detail; id: string }) {
  const [values, setValues] = useState<FormValues>(() => {
    const fields: FormValues = { tipo_comissao: 'Nenhuma', validado: 'Não', is_cliente: false, is_fornecedor: false, is_prestador: false, reter_iss: false };
    const source = { ...data.cadastro, ...(data.admin ? data.bancario : {}) };
    for (const key of Object.values(fieldGroups).flat()) {
      const value = source[key as keyof typeof source];
      if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') fields[key] = value;
    }
    return fields;
  });
  const [error, setError] = useState('');
  const [cepBusy, setCepBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate(); const queryClient = useQueryClient();
  const set = (key: string, value: string | boolean | null) => setValues(v => ({ ...v, [key]: value }));
  const save = useMutation({ mutationFn: async () => {
    const payload: FormValues = {};
    for (const field of Object.values(fieldGroups).flat()) {
      if (bankingFields.includes(field) && !data.admin) continue;
      const value = values[field];
      payload[field] = booleanFields.includes(field) ? !!value : numericFields.includes(field) ? parseNumeric(String(value ?? '')) : String(value ?? '').trim() || null;
    }
    if (!payload['nome']) throw new Error('Nome obrigatório');
    const result = await supabase.rpc('salvar_cadastro', { dados: payload, ...(id !== 'novo' ? { cadastro_uuid: id } : {}) });
    if (result.error) throw new Error(result.error.code === '23505' ? 'Este CPF/CNPJ ou ID SIGE já está cadastrado. Confira o cadastro existente.' : result.error.message);
    return result.data;
  }, onSuccess: async savedId => {
    await queryClient.invalidateQueries({ queryKey: ['cadastros'] }); toast.success('Cadastro salvo');
    navigate({ to: '/cadastros/$id', params: { id: savedId } });
  }, onError: e => setError(e.message) });
  const remove = useMutation({ mutationFn: async () => {
    const result = await supabase.from('cadastros').delete().eq('id', id).select('id');
    if (result.error || !result.data.length) throw new Error(result.error?.message ?? 'Não foi possível excluir');
  }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cadastros'] }); toast.success('Cadastro excluído'); navigate({ to: '/cadastros' }); }, onError: e => setError(e.message) });
  async function lookupCep() {
    const cep = String(values['cep'] ?? '').replace(/\D/g, '');
    if (cep.length !== 8) { setError('Informe um CEP com 8 dígitos.'); return; }
    setCepBusy(true); setError('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Não foi possível consultar o CEP.');
      const address = await response.json();
      if (address.erro) throw new Error('CEP não encontrado.');
      setValues(v => ({ ...v, endereco: address.logradouro, bairro: address.bairro, cidade: address.localidade, estado: address.uf, codigo_municipio: address.ibge }));
      toast.success('Endereço encontrado');
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha na busca de CEP'); } finally { setCepBusy(false); }
  }
  function field(key: string) {
    const label = labels[key]; const value = values[key];
    if (booleanFields.includes(key)) return <label key={key} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={!!value} onChange={e => set(key, e.target.checked)} className="size-4 accent-primary" />{label}</label>;
    return <label key={key} className={`space-y-2 text-sm ${key === 'observacao' ? 'sm:col-span-2 lg:col-span-3' : ''}`}><span className="block font-medium">{label}{key === 'nome' ? ' *' : ''}</span>
      {options[key] ? <select aria-label={label} className="h-10 w-full rounded-md border bg-surface px-3" value={String(value ?? '')} onChange={e => set(key, e.target.value)}><option value="">—</option>{options[key].map(option => <option key={option}>{option}</option>)}</select> : key === 'observacao' ? <textarea aria-label={label} rows={4} className="w-full rounded-md border bg-surface p-3" value={String(value ?? '')} onChange={e => set(key, e.target.value)} /> : <div className="flex gap-2"><Input aria-label={label} required={key === 'nome'} value={String(value ?? '')} inputMode={numericFields.includes(key) ? 'decimal' : undefined} maxLength={key === 'estado' ? 2 : undefined} onChange={e => {
        const raw = e.target.value;
        set(key, key === 'cpf_cnpj' ? maskDocument(raw) : key === 'cep' ? maskCep(raw) : key.includes('telefone') || key.startsWith('celular') ? maskPhone(raw) : key === 'estado' ? raw.toUpperCase() : raw);
      }} />{key === 'cep' && <Button type="button" variant="outline" size="icon" title="Buscar CEP" aria-label="Buscar CEP" disabled={cepBusy} onClick={lookupCep}><Search /></Button>}</div>}
    </label>;
  }
  const tabs: Record<string, string> = { gerais: 'Dados gerais', contatos: 'Contatos', endereco: 'Endereço', fiscal: 'Fiscal/Comissão', bancario: 'Bancário' };
  return <form className="space-y-6 p-4 md:p-6" onSubmit={e => { e.preventDefault(); setError(''); save.mutate(); }}>
    <div className="flex flex-wrap items-center gap-3"><Button type="button" variant="ghost" size="icon" aria-label="Voltar aos cadastros" onClick={() => navigate({ to: '/cadastros' })}><ArrowLeft /></Button><h1 className="min-w-0 flex-1 break-words text-2xl font-semibold">{id === 'novo' ? 'Novo cadastro' : data.cadastro?.nome}</h1><Button type="submit" disabled={save.isPending || remove.isPending}><Save />{save.isPending ? 'Salvando…' : 'Salvar'}</Button></div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {data.cadastro?.restricao_sige && <div role="status" className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm"><strong>Restrição no SIGE</strong><p className="mt-1">{data.cadastro.restricao_observacao}</p></div>}
    <Tabs defaultValue="gerais"><div className="overflow-x-auto"><TabsList className="h-auto w-max">{Object.entries(tabs).filter(([key]) => key !== 'bancario' || data.admin).map(([key, label]) => <TabsTrigger value={key} key={key}>{label}</TabsTrigger>)}</TabsList></div>{Object.entries(fieldGroups).filter(([key]) => key !== 'bancario' || data.admin).map(([key, fields]) => <TabsContent key={key} value={key}><div className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-2 lg:grid-cols-3">{fields.map(field)}</div></TabsContent>)}</Tabs>
    {id !== 'novo' && data.admin && <div className="border-t pt-6"><Button type="button" variant="destructive" onClick={() => setDeleting(true)}><Trash2 />Excluir cadastro</Button></div>}
    <Dialog open={deleting} onOpenChange={setDeleting}><DialogContent><DialogTitle>Excluir cadastro?</DialogTitle><DialogDescription>O cadastro e seus dados bancários serão excluídos permanentemente.</DialogDescription><Button type="button" variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate()}>Confirmar exclusão</Button></DialogContent></Dialog>
  </form>;
}