export { SETORES_PROGRAMACAO as SETORES_SUGERIDOS } from './programacao';

export type EquipeForm = {
  nome: string;
  setor: string;
  capacidade_horas_dia: string;
  colaboradores: string[];
  veiculos: string[];
};

export function validarEquipe(dados: EquipeForm) {
  if (!dados.nome.trim()) return 'Informe o nome da equipe.';
  if (!dados.setor.trim()) return 'Informe o setor da equipe.';
  const capacidade = Number(dados.capacidade_horas_dia.replace(',', '.'));
  if (!Number.isFinite(capacidade) || capacidade <= 0) return 'A capacidade diária deve ser maior que zero.';
  if (!dados.colaboradores.length && !dados.veiculos.length) return 'Selecione pelo menos um colaborador ou um veículo.';
  return null;
}

export function capacidadeNumerica(valor: string) {
  return Number(valor.replace(',', '.'));
}
