import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { PLANEJAMENTO_IMAGEM_TTL_SEGUNDOS } from '@/lib/planejamento-imagens';

const paramsSchema = z.object({ id: z.string().uuid() });

export const Route = createFileRoute('/img/$id')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const validacao = paramsSchema.safeParse(params);
        if (!validacao.success) return new Response('Imagem inválida.', { status: 400 });

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const imagem = await supabaseAdmin
          .from('planejamento_imagens')
          .select('storage_path')
          .eq('id', validacao.data.id)
          .maybeSingle();
        if (imagem.error || !imagem.data) return new Response('Imagem não encontrada.', { status: 404 });

        const miniatura = new URL(request.url).searchParams.get('miniatura') === '1';
        const assinado = await supabaseAdmin.storage
          .from('planejamento-imagens')
          .createSignedUrl(imagem.data.storage_path, PLANEJAMENTO_IMAGEM_TTL_SEGUNDOS, miniatura ? {
            transform: { width: 240, height: 240, resize: 'cover', quality: 75 },
          } : undefined);
        if (assinado.error || !assinado.data?.signedUrl) return new Response('Não foi possível abrir a imagem.', { status: 502 });

        // O endereço público do backend pode diferir do endereço interno usado pelo servidor.
        const destino = new URL(assinado.data.signedUrl);
        const urlPublica = process.env['VITE_SUPABASE_URL'];
        if (urlPublica) {
          const publico = new URL(urlPublica);
          destino.protocol = publico.protocol;
          destino.host = publico.host;
        }

        return new Response(null, {
          status: 302,
          headers: {
            Location: destino.toString(),
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      },
    },
  },
});
