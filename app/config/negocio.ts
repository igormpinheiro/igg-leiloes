// config/negocio.ts
// Configurações centralizadas de valores de negócio

export const CONFIG_NEGOCIO = {
  // Estratégia de Revenda
  revenda: {
    desagioPadrao: 0.10, // 15% abaixo do valor de mercado
    ipvaEstimado: 0.03, // 3% do valor de mercado se não pago
  },

  // Logística
  logistica: {
    freteForaDF: 400,
  },

  // Estimativas
  estimativas: {
    kmAnual: 14000,
  },

  // ROI (métrica principal)
  roi: {
    excelente: 40,
    muitoBom: 35,
    bom: 30,
    regular: 20,
  },

  // Score final (0-10)
  score: {
    excelente: 8.5,
    muitoBom: 7.0,
    bom: 5.0,
    regular: 3.0,
  },

  // Pesos do algoritmo (somam 1.0)
  pesos: {
    roi: 0.4,
    lucroAbsoluto: 0.2,
    quilometragem: 0.2,
    marca: 0.1,
    qualidadeDados: 0.1,
  },

  // Penalidades de risco (multiplicadores)
  risco: {
    descricao: {
      motorGrave: 0.25,
      semChave: 0.6,
    },
    sinistro: {
      nenhum: 1,
      indicio: 0.75,
      recuperado: 0.4,
      pequena: 0.6,
      media: 0.25,
      grande: 0,
    },
    kmNaoInformada: 0.9,
  },
} as const;
