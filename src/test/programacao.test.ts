import { describe, it, expect } from 'vitest';
import { agruparResumo, detectarConflitos, diasEmAberto, idsComAlertaPendente, linhaVazia, quantidadeServicosNoDia, SETORES_PROGRAMACAO, textoWhatsApp, validarLinha, type Alocacao, type ItemResumo } from '@/lib/programacao';

const aloc = (p: Partial<Alocacao>): Alocacao => ({ id: 'x', grupo: 'g', descricao: '', data_inicio: '2026-11-16', data_fim: '2026-11-16', colaboradores: [], ...p });

describe('setores da programação', () => {
  it('tem os 7 setores da empresa', () => expect(SETORES_PROGRAMACAO).toEqual(['Externa', 'Projetos especiais', 'Serralheria', 'Acabamento e montagem', 'Produção', 'Corte', 'Pintura']));
});

describe('nova linha', () => {
  it('cria objeto novo e totalmente vazio, exceto pela data selecionada', () => {
    const anterior = { ...linhaVazia('2026-11-16'), setor: 'Serralheria' as const, cliente: 'ACME', equipe_id: 'e1', lider_id: 'l1', ajudantes: ['a1'], veiculo_id: 'v1', servico: 'Soldar', detalhamento: 'x' };
    const nova = linhaVazia('2026-11-17');
    expect(nova).toMatchObject({ data: '2026-11-17', setor: '', cliente: '', produto: '', servico: '', detalhamento: '', local: '', quantidade: '', equipe_id: '', lider_id: '', ajudantes: [], veiculo_id: '', hora_inicio: '', hora_fim: '', observacao: '', conflito_confirmado: false });
    expect(nova).not.toBe(anterior);
    expect(nova.ajudantes).not.toBe(anterior.ajudantes);
    expect(nova.chave).not.toBe(anterior.chave);
  });
});

describe('validação de linha', () => {
  const base = { data: '2026-11-16', setor: 'Externa' as const, servico: 'Instalação', quantidade: '1', hora_inicio: '', hora_fim: '' };
  it('exige setor', () => expect(validarLinha({ ...base, setor: '' })).toBe('Informe o setor.'));
  it('exige serviço', () => expect(validarLinha({ ...base, servico: ' ' })).toBe('Informe o serviço.'));
  it('quantidade deve ser positiva', () => expect(validarLinha({ ...base, quantidade: '0' })).toMatch(/quantidade/));
  it('aceita vírgula na quantidade', () => expect(validarLinha({ ...base, quantidade: '2,5' })).toBeNull());
});

describe('conflitos de recursos', () => {
  it('colaborador em duas equipes no mesmo dia gera conflito', () => {
    const c = detectarConflitos([aloc({ id: 'a', grupo: 'equipe:1', colaboradores: ['p1'] }), aloc({ id: 'b', grupo: 'equipe:2', colaboradores: ['p1'] })]);
    expect(c).toEqual([{ recurso: 'colaborador', recursoId: 'p1', alocacoes: ['a', 'b'] }]);
  });
  it('mesma equipe com vários serviços no dia também gera somente aviso', () => {
    expect(detectarConflitos([aloc({ id: 'a', grupo: 'equipe:1', colaboradores: ['p1'] }), aloc({ id: 'b', grupo: 'equipe:1', colaboradores: ['p1'] })])).toHaveLength(1);
  });
  it('veículo em duas equipes gera conflito', () => {
    expect(detectarConflitos([aloc({ id: 'a', grupo: 'g1', veiculo_id: 'v' }), aloc({ id: 'b', grupo: 'g2', veiculo_id: 'v' })])[0]?.recurso).toBe('veiculo');
  });
  it('horários diferentes no mesmo dia também geram aviso informativo', () => {
    expect(detectarConflitos([aloc({ id: 'a', grupo: 'g1', colaboradores: ['p'], hora_inicio: '08:00', hora_fim: '10:00' }), aloc({ id: 'b', grupo: 'g2', colaboradores: ['p'], hora_inicio: '10:00', hora_fim: '12:00' })])).toHaveLength(1);
  });
  it('confirmação retira o aviso e mantém o indicador de dois serviços', () => {
    const alocacoes = [aloc({ id: 'a', colaboradores: ['p'], confirmado: true }), aloc({ id: 'b', colaboradores: ['p'], confirmado: true })];
    const conflitos = detectarConflitos(alocacoes);
    expect(idsComAlertaPendente(conflitos, alocacoes).size).toBe(0);
    expect(quantidadeServicosNoDia('a', conflitos)).toBe(2);
  });
  it('somente a alocação não confirmada permanece com aviso', () => {
    const alocacoes = [aloc({ id: 'a', colaboradores: ['p'], confirmado: true }), aloc({ id: 'b', colaboradores: ['p'], confirmado: false })];
    expect([...idsComAlertaPendente(detectarConflitos(alocacoes), alocacoes)]).toEqual(['b']);
  });
  it('dias diferentes não conflitam', () => {
    expect(detectarConflitos([aloc({ id: 'a', grupo: 'g1', colaboradores: ['p'] }), aloc({ id: 'b', grupo: 'g2', colaboradores: ['p'], data_inicio: '2026-11-17', data_fim: '2026-11-17' })])).toEqual([]);
  });
});

describe('pendências', () => {
  it('conta dias em aberto desde a data programada', () => {
    expect(diasEmAberto('2026-11-12', '2026-11-16')).toBe(4);
    expect(diasEmAberto('2026-11-20', '2026-11-16')).toBe(0);
  });
});

describe('resumo do dia e WhatsApp', () => {
  const it1: ItemResumo = { id: '1', equipe_id: 'e', equipeNome: 'Equipe A', liderNome: 'João', ajudantesNomes: ['Pedro'], veiculo_id: 'v', veiculoNome: 'ABC1D23', cliente: 'ACME', servico: 'Instalação', produto: 'Outdoor', detalhamento: 'Lona nova', local: 'Av. Brasil, 100', quantidade: 1, status: 'Programado', setor: 'Externa' };
  const it2: ItemResumo = { ...it1, id: '2', status: 'Concluído', cliente: 'Beta', detalhamento: null, local: null };
  const it3: ItemResumo = { ...it1, id: '3', status: 'Não realizado' };
  it('agrupa por equipe e veículo com contagens', () => {
    const [g] = agruparResumo([it1, it2, it3]);
    expect(g).toMatchObject({ titulo: 'Equipe A / João', programados: 1, concluidos: 1, pendentes: 1, veiculo: 'ABC1D23', ajudantes: ['Pedro'] });
  });
  it('identifica agendamentos do cronograma no texto do WhatsApp', () => {
    const agendamento: ItemResumo = { ...it1, id: 'ag-1', origem: 'agendamento', servico: 'Instalação agendada' };
    const t = textoWhatsApp('2026-11-16', agruparResumo([agendamento]));
    expect(t).toContain('Instalação agendada');
    expect(t).toContain('📌 Agendamento do cronograma');
  });
  it('ordena os itens por horário dentro de cada equipe', () => {
    const tarde = { ...it1, id: 'tarde', hora_inicio: '14:00' };
    const cedo = { ...it1, id: 'cedo', hora_inicio: '08:00' };
    const [g] = agruparResumo([tarde, cedo]);
    expect(g?.itens.map(item => item.id)).toEqual(['cedo', 'tarde']);
  });
  it('inclui observações e links permanentes das imagens no WhatsApp', () => {
    const imagem = { id: '780ce256-407d-42a2-8298-43a23f82dca0', nome: 'estrutura.png' };
    const t = textoWhatsApp('2026-11-16', agruparResumo([{ ...it1, observacao: 'Levar escada', imagens: [imagem] }]), 'https://pattyone.lovable.app');
    expect(t).toContain('💬 Levar escada');
    expect(t).toContain(`https://pattyone.lovable.app/img/${imagem.id}`);
  });
  it('gera texto com data, equipe, veículo e itens', () => {
    const t = textoWhatsApp('2026-11-16', agruparResumo([it1]));
    expect(t).toContain('📅 *PROGRAMAÇÃO 16/11/2026*');
    expect(t).toContain('👥 *Equipe A / João / Pedro* · 🚚 ABC1D23');
    expect(t).toContain('1. ACME — Instalação Outdoor');
    expect(t).toContain('📝 Lona nova');
    expect(t).toContain('📍 Av. Brasil, 100');
  });
});
