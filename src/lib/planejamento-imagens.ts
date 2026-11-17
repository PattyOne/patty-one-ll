export const PLANEJAMENTO_IMAGEM_TTL_SEGUNDOS = 300;
export const PLANEJAMENTO_IMAGEM_MAX_BYTES = 10 * 1024 * 1024;
export const TIPOS_IMAGEM_PLANEJAMENTO = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export function validarImagemPlanejamento(arquivo: { type: string; size: number }) {
  if (!TIPOS_IMAGEM_PLANEJAMENTO.includes(arquivo.type as typeof TIPOS_IMAGEM_PLANEJAMENTO[number])) return 'Use uma imagem JPG, PNG, WEBP ou GIF.';
  if (arquivo.size <= 0) return 'A imagem está vazia.';
  if (arquivo.size > PLANEJAMENTO_IMAGEM_MAX_BYTES) return 'Cada imagem deve ter no máximo 10 MB.';
  return null;
}

export function caminhoImagemPlanejamento(usuarioId: string, origem: 'programacao' | 'agendamento', entidadeId: string, nome: string) {
  const extensao = nome.split('.').pop()?.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]/g, '') || 'jpg';
  return `${usuarioId}/${origem}/${entidadeId}/${crypto.randomUUID()}.${extensao}`;
}

export function caminhoPublicoImagem(id: string) {
  return `/img/${encodeURIComponent(id)}`;
}

export function linkPublicoImagem(origem: string, id: string) {
  return new URL(caminhoPublicoImagem(id), origem).toString();
}
