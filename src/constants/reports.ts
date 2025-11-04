export const CATEGORIAS_DESPESA = [
  "Combustível",
  "Hospedagem",
  "Alimentação",
  "Transporte",
  "Outros"
] as const;

export const PAGADORES = [
  "Tripulante",
  "Cliente",
  "ShareBrasil"
] as const;

export type CategoriaDespesa = typeof CATEGORIAS_DESPESA[number];
export type TipoPagador = typeof PAGADORES[number];