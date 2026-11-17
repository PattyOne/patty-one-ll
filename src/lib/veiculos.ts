export type VeiculoRotulo = {
  placa: string;
  modelo?: string | null;
  apelido?: string | null;
};

export function rotuloVeiculo(veiculo: VeiculoRotulo) {
  const nome = veiculo.apelido?.trim() || veiculo.modelo?.trim();
  return [nome, veiculo.placa].filter(Boolean).join(' — ');
}

export function normalizarPlaca(placa: string) {
  return placa.trim().toLocaleUpperCase('pt-BR').replace(/\s+/g, '');
}

export function validarVeiculo(dados: { placa: string; modelo?: string; apelido?: string }) {
  if (!normalizarPlaca(dados.placa)) return 'Informe a placa do veículo.';
  if (normalizarPlaca(dados.placa).length > 10) return 'A placa deve ter no máximo 10 caracteres.';
  if (dados.modelo && dados.modelo.length > 120) return 'O modelo deve ter no máximo 120 caracteres.';
  if (dados.apelido && dados.apelido.length > 80) return 'O apelido deve ter no máximo 80 caracteres.';
  return null;
}
