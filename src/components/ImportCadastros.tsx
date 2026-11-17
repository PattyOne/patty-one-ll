import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { importFields, normalizeHeader, normalizeRow, type FormValues } from '@/lib/cadastros-fields';

type Result = { linha: number; nome: string | null; cpf_cnpj: string | null; resultado: 'inserido' | 'atualizado' | 'erro'; motivo: string | null };
type ParsedRow = { raw: Record<string, string>; data?: FormValues; error?: string; linha: number };
export function ImportCadastros() {
  const { admin, loading, error: roleError } = useAdmin();
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [complete, setComplete] = useState(false);
  async function readFile(file: File) {
    setError(''); setRows([]); setResults([]); setComplete(false); setProgress(0); setFileName(file.name);
    try {
      const parsed = Papa.parse<Record<string, string>>((await file.text()).replace(/^\uFEFF/, ''), { header: true, delimiter: ',', skipEmptyLines: 'greedy' });
      const fields = parsed.meta.fields ?? [];
      if (new Set(fields.map(normalizeHeader)).size !== fields.length || fields.some(h => /_\d+$/.test(h) && parsed.meta.renamedHeaders?.[h])) throw new Error('Cabeçalhos duplicados no CSV.');
      if (!fields.map(normalizeHeader).includes('nome')) throw new Error('O CSV precisa da coluna nome.');
      const fatal = parsed.errors.filter(e => e.row === undefined);
      if (fatal.length) throw new Error(fatal.map(e => e.message).join('; '));
      setHeaders(fields);
      setRows(parsed.data.map((raw, i) => {
        try {
          const parseError = parsed.errors.find(e => e.row === i);
          if (parseError) throw new Error(parseError.message);
          return { raw, data: normalizeRow(raw), linha: i + 2 };
        } catch (e) { return { raw, linha: i + 2, error: e instanceof Error ? e.message : 'Linha inválida' }; }
      }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível ler o CSV.'); }
  }
  async function runImport() {
    setBusy(true); setComplete(false); setResults([]); setProgress(0); setError('');
    const output: Result[] = [];
    try {
      for (let start = 0; start < rows.length; start += 500) {
        const batch = rows.slice(start, start + 500);
        const valid = batch.filter(r => r.data && !r.error);
        output.push(...batch.filter(r => r.error).map(r => ({ linha: r.linha, nome: r.raw[headers.find(h => normalizeHeader(h) === 'nome') ?? 'nome'] ?? null, cpf_cnpj: r.raw[headers.find(h => normalizeHeader(h) === 'cpf_cnpj') ?? 'cpf_cnpj'] ?? null, resultado: 'erro' as const, motivo: r.error ?? 'Linha inválida' })));
        if (valid.length) {
          const result = await supabase.rpc('importar_cadastros', { linhas: valid.map(r => ({ ...r.data, linha: r.linha })) });
          if (result.error) throw new Error(result.error.message);
          output.push(...result.data as unknown as Result[]);
        }
        setResults([...output].sort((a, b) => a.linha - b.linha));
        setProgress(Math.round(Math.min(start + 500, rows.length) / rows.length * 100));
      }
      setComplete(true);
    } catch (e) { setError(`Importação interrompida: ${e instanceof Error ? e.message : 'Falha de conexão'}. Os resultados abaixo correspondem às linhas já processadas.`); }
    finally { setBusy(false); queryClient.invalidateQueries({ queryKey: ['cadastros'] }); }
  }
  function downloadErrors() {
    const csv = '\uFEFF' + Papa.unparse(results.filter(r => r.resultado === 'erro').map(r => ({ linha: r.linha, nome: r.nome, cpf_cnpj: r.cpf_cnpj, motivo: r.motivo })), { escapeFormulae: true });
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'erros-importacao.csv'; a.click(); URL.revokeObjectURL(url);
  }
  if (loading) return <div className="p-6">Carregando…</div>;
  if (roleError || !admin) return <div className="p-6"><h1 className="text-2xl font-semibold">Acesso restrito</h1></div>;
  const unknown = headers.filter(h => !importFields.includes(normalizeHeader(h)));
  const missing = importFields.filter(f => !headers.map(normalizeHeader).includes(f));
  const errors = results.filter(r => r.resultado === 'erro');
  return <div className="space-y-6 p-4 md:p-6">
    <h1 className="text-2xl font-semibold text-text-primary">Importar dados</h1>
    <div className="flex flex-wrap items-center gap-4 border-b pb-6">
      <FileSpreadsheet className="h-8 w-8 text-primary" />
      <input ref={input} type="file" accept=".csv,text/csv" className="hidden" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void readFile(file); e.target.value = ''; }} />
      <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload />Selecionar CSV</Button>
      <span className="min-w-0 break-all text-sm text-text-secondary">{fileName}</span>
      {rows.length > 0 && <span className="font-medium">{rows.length.toLocaleString('pt-BR')} linhas</span>}
    </div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {rows.length > 0 && <>
      <div className="space-y-2 break-words text-sm"><p><strong>Colunas não reconhecidas:</strong> {unknown.join(', ') || 'Nenhuma'}</p><p className="text-text-secondary"><strong>Campos sem coluna:</strong> {missing.join(', ') || 'Nenhum'}</p></div>
      <h2 className="font-semibold">Prévia — primeiras {Math.min(20, rows.length)} linhas</h2>
      <div className="max-h-96 overflow-auto rounded-md border bg-surface"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-surface-elevated"><tr><th className="p-3">Linha</th>{headers.map(h => <th className="whitespace-nowrap p-3" key={h}>{h}</th>)}</tr></thead><tbody>{rows.slice(0, 20).map(row => <tr key={row.linha} className="border-t"><td className="p-3">{row.linha}</td>{headers.map(h => <td className="max-w-64 min-w-32 whitespace-pre-wrap break-words p-3" key={h}>{row.raw[h]}</td>)}</tr>)}</tbody></table></div>
      <div className="flex items-center gap-4"><Button onClick={runImport} disabled={busy}><Upload />{busy ? 'Importando…' : 'Importar cadastros'}</Button><span className="text-sm">{progress}%</span></div>
      <Progress value={progress} aria-label="Progresso da importação" />
    </>}
    {(complete || results.length > 0) && <section className="space-y-4 border-t pt-6"><h2 className="font-semibold">{complete ? 'Importação concluída' : 'Resultados parciais'}</h2><div className="flex flex-wrap gap-6" aria-live="polite"><p>Inseridos: <strong>{results.filter(r => r.resultado === 'inserido').length}</strong></p><p>Atualizados: <strong>{results.filter(r => r.resultado === 'atualizado').length}</strong></p><p>Erros: <strong>{errors.length}</strong></p></div>{errors.length > 0 && <><Button variant="outline" onClick={downloadErrors}><Download />Baixar erros em CSV</Button><div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{['Linha', 'Nome', 'CPF/CNPJ', 'Motivo'].map(h => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{errors.map(r => <tr key={r.linha} className="border-t"><td className="p-3">{r.linha}</td><td className="p-3">{r.nome || '—'}</td><td className="p-3">{r.cpf_cnpj || '—'}</td><td className="p-3 text-destructive">{r.motivo}</td></tr>)}</tbody></table></div></>}</section>}
  </div>;
}