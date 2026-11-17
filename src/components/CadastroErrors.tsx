import { Button } from '@/components/ui/button';
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
export function CadastroError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return <div className="space-y-4 p-6"><h1 className="text-xl font-semibold">Não foi possível abrir os cadastros</h1><p role="alert" className="text-destructive">{error instanceof Error ? error.message : 'Falha ao carregar cadastros'}</p><Button onClick={() => router.invalidate()}>Tentar novamente</Button></div>;
}
export function CadastroNotFound() { return <div className="p-6">Cadastro não encontrado.</div>; }