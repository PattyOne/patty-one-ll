import { describe, expect, it } from 'vitest';
import { caminhoPublicoImagem, linkPublicoImagem, PLANEJAMENTO_IMAGEM_MAX_BYTES, PLANEJAMENTO_IMAGEM_TTL_SEGUNDOS, validarImagemPlanejamento } from '@/lib/planejamento-imagens';

describe('imagens da programação e dos agendamentos', () => {
  it('usa links privados com validade de cinco minutos', () => {
    expect(PLANEJAMENTO_IMAGEM_TTL_SEGUNDOS).toBe(300);
  });
  it('mantém um endereço estável para renovar o acesso a cada clique', () => {
    const id = '780ce256-407d-42a2-8298-43a23f82dca0';
    expect(caminhoPublicoImagem(id)).toBe(`/img/${id}`);
    expect(linkPublicoImagem('https://pattyone.lovable.app', id)).toBe(`https://pattyone.lovable.app/img/${id}`);
  });
  it('aceita JPG dentro do limite de 10 MB', () => {
    expect(validarImagemPlanejamento({ type: 'image/jpeg', size: 1024 })).toBeNull();
    expect(PLANEJAMENTO_IMAGEM_MAX_BYTES).toBe(10485760);
  });
  it('rejeita arquivos que não são imagens compatíveis', () => {
    expect(validarImagemPlanejamento({ type: 'application/pdf', size: 1024 })).toBe('Use uma imagem JPG, PNG, WEBP ou GIF.');
  });
  it('rejeita imagens acima de 10 MB ou vazias', () => {
    expect(validarImagemPlanejamento({ type: 'image/png', size: 10485761 })).toBe('Cada imagem deve ter no máximo 10 MB.');
    expect(validarImagemPlanejamento({ type: 'image/png', size: 0 })).toBe('A imagem está vazia.');
  });
});
