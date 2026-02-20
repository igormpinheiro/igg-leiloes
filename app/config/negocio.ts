// config/negocio.ts
// Configurações centralizadas de valores de negócio

export const CONFIG_NEGOCIO = {
  // Custos de aquisição
  taxaLeilao: 0.05, // 5% sobre o lance
  despesasFixas: 1700, // R$ 1.700,00

  // Custos de venda
  comissaoVenda: 0.15, // 15% sobre o valor de mercado

  // Estimativas
  kmAnualEstimado: 14000, // 14.000 km por ano

  // Thresholds de score
  score: {
    excelente: 8.5,
    muitoBom: 7.0,
    bom: 5.0,
    regular: 3.0,
  },

  // Thresholds de porcentagem do lance vs mercado
  porcentagem: {
    excelente: 50,
    muitoBom: 60,
    bom: 70,
    regular: 80,
  },

  // Thresholds de lucro estimado
  lucro: {
    excelente: 10000,
    bom: 5000,
  },
} as const
