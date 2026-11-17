import { AlertTriangle, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function ConfirmacaoConflitos({ mensagens, salvando, onConfirmar, onCancelar }: {
  mensagens: string[];
  salvando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return <AlertDialog open onOpenChange={aberto => { if (!aberto && !salvando) onCancelar(); }}>
    <AlertDialogContent className="bg-surface">
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-warning" />Confirmar recursos compartilhados</AlertDialogTitle>
        <AlertDialogDescription>Isso é apenas um aviso e não impede o salvamento.</AlertDialogDescription>
      </AlertDialogHeader>
      <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-warning/40 bg-warning/10 p-3">
        {mensagens.map((mensagem, indice) => <p key={`${indice}-${mensagem}`} className="text-sm">{mensagem}</p>)}
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={salvando} onClick={onCancelar}>Cancelar</AlertDialogCancel>
        <AlertDialogAction disabled={salvando} onClick={evento => { evento.preventDefault(); onConfirmar(); }}>
          {salvando && <Loader2 className="animate-spin" />}Confirmar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
