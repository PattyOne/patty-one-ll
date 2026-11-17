import { createFileRoute } from '@tanstack/react-router';
import { ImportCadastros } from '@/components/ImportCadastros';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/_authenticated/importar')({ head: () => pageMeta('Importar dados', 'Importação de cadastros SIGE do grupo no PattyOne.'), component: ImportCadastros });