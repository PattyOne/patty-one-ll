import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { detailOptions } from '@/lib/cadastros-queries';
import { CadastroForm } from '@/components/CadastroForm';
import { CadastroError, CadastroNotFound } from '@/components/CadastroErrors';
import { pageMeta } from '@/lib/page-meta';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
export const Route = createFileRoute('/_authenticated/cadastros_/$id')({
  loader: async ({ context, params }) => { const { data } = await supabase.auth.getSession(); await context.queryClient.ensureQueryData(detailOptions(params.id, data.session?.user.id ?? '')); },
  head: ({ params }) => pageMeta(params.id === 'novo' ? 'Novo cadastro' : 'Ficha de cadastro', 'Contatos, endereço e informações fiscais do cadastro no PattyOne.'),
  errorComponent: CadastroError, notFoundComponent: CadastroNotFound, component: DetailPage,
});
function DetailPage() { const { id } = Route.useParams(); const { user } = useAuth(); const { data } = useSuspenseQuery(detailOptions(id, user?.id ?? '')); return <CadastroForm key={`${id}-${user?.id}`} id={id} data={data} />; }