import type { Veiculo } from "~/types/veiculo";
import { VeiculoRanker } from "~/services/veiculoRankerService";
import { CONFIG_NEGOCIO } from "~/config/negocio";

type ScoreComponenteExplicacao = {
  notaBruta: number;
  peso: number;
  contribuicao: number;
};

type ScoreExplicacao = {
  scoreFinal: number;
  scoreBase10: number;
  componentes: {
    roi: ScoreComponenteExplicacao;
    lucro: ScoreComponenteExplicacao;
    km: ScoreComponenteExplicacao;
    marca: ScoreComponenteExplicacao;
    dados: ScoreComponenteExplicacao;
  };
  risco: {
    riscoTotal: number;
    roiAjustado: number;
    lucroAjustado: number;
    kmInformada: boolean;
    flagsDescricao: string[];
  };
  gates: {
    penalidadeRoiBaixo: boolean;
    penalidadeDadosFinanceiros: boolean;
    totalPenalidade: number;
  };
};

export function useVeiculoScore() {
  const { score, roi, pesos } = CONFIG_NEGOCIO;
  const thresholdMercado = {
    excelente: 50,
    muitoBom: 60,
    bom: 70,
    regular: 80,
  } as const;

  function getBreakdown(veiculo: Veiculo) {
    return VeiculoRanker.calcularBreakdown(veiculo, veiculo.leiloeiro);
  }

  function getScore(veiculo: Veiculo): number {
    return getBreakdown(veiculo).scoreFinal;
  }

  function getScoreClass(scoreValue: number): string {
    if (scoreValue >= score.excelente) return "bg-green-100 text-green-800";
    if (scoreValue >= score.muitoBom) return "bg-blue-100 text-blue-800";
    if (scoreValue >= score.bom) return "bg-yellow-100 text-yellow-800";
    if (scoreValue >= score.regular) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  }

  function getScoreIcon(scoreValue: number): string {
    if (scoreValue >= score.excelente) return "🏆";
    if (scoreValue >= score.muitoBom) return "🥈";
    if (scoreValue >= score.bom) return "🥉";
    if (scoreValue >= score.regular) return "⚠️";
    return "❌";
  }

  function getRoiClass(roiValue: number): string {
    if (roiValue >= roi.excelente) return "bg-green-500 text-white font-bold";
    if (roiValue >= roi.muitoBom) return "bg-green-200 text-green-900";
    if (roiValue >= roi.bom) return "bg-blue-100 text-blue-800";
    if (roiValue >= roi.regular) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  }

  function getRoiTextClass(roiValue: number): string {
    if (roiValue >= roi.excelente) return "text-white font-bold";
    if (roiValue >= roi.muitoBom) return "text-green-900 font-bold";
    if (roiValue >= roi.bom) return "text-blue-600 font-bold";
    if (roiValue >= roi.regular) return "text-orange-600 font-bold";
    return "text-red-600 font-bold";
  }

  function getPercentageClass(percentage: number): string {
    if (percentage < thresholdMercado.excelente) return "bg-green-100 text-green-800";
    if (percentage < thresholdMercado.muitoBom) return "bg-emerald-100 text-emerald-800";
    if (percentage < thresholdMercado.bom) return "bg-blue-100 text-blue-800";
    if (percentage < thresholdMercado.regular) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  }

  function getLucroClass(roiValue: number): string {
    if (roiValue >= roi.excelente) return "bg-green-100 text-green-800";
    if (roiValue >= roi.muitoBom) return "bg-emerald-100 text-emerald-800";
    if (roiValue >= roi.bom) return "bg-blue-100 text-blue-800";
    if (roiValue >= roi.regular) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  }

  function getLucroTextClass(roiValue: number): string {
    if (roiValue >= roi.excelente) return "text-green-700 font-bold";
    if (roiValue >= roi.muitoBom) return "text-emerald-700 font-bold";
    if (roiValue >= roi.bom) return "text-blue-700 font-bold";
    if (roiValue >= roi.regular) return "text-yellow-700 font-bold";
    return "text-red-600 font-bold";
  }

  function calcularRoi(veiculo: Veiculo): number {
    return getBreakdown(veiculo).roiAjustado;
  }

  function calcularLucroEstimado(veiculo: Veiculo): number {
    return getBreakdown(veiculo).lucroProjetado;
  }

  function getPorcentagemMercado(veiculo: Veiculo): number {
    const b = getBreakdown(veiculo);
    if (!b.valorMercado || !b.lance) return 0;
    return (b.lance / b.valorMercado) * 100;
  }

  function getScoreBreakdown(veiculo: Veiculo) {
    return getBreakdown(veiculo);
  }

  function getScoreExplicacao(veiculo: Veiculo): ScoreExplicacao {
    const breakdown = getScoreBreakdown(veiculo);
    const scoreBase10 = breakdown.scoreBase * 10;
    const penalidadeRoiBaixo = breakdown.roiAjustado < roi.regular;
    const penalidadeDadosFinanceiros = breakdown.valorMercado <= 0 || breakdown.lance <= 0;

    return {
      scoreFinal: breakdown.scoreFinal,
      scoreBase10,
      componentes: {
        roi: {
          notaBruta: breakdown.scoreRoi,
          peso: pesos.roi,
          contribuicao: breakdown.scoreRoi * pesos.roi * 10,
        },
        lucro: {
          notaBruta: breakdown.scoreLucro,
          peso: pesos.lucroAbsoluto,
          contribuicao: breakdown.scoreLucro * pesos.lucroAbsoluto * 10,
        },
        km: {
          notaBruta: breakdown.scoreKm,
          peso: pesos.quilometragem,
          contribuicao: breakdown.scoreKm * pesos.quilometragem * 10,
        },
        marca: {
          notaBruta: breakdown.scoreMarca,
          peso: pesos.marca,
          contribuicao: breakdown.scoreMarca * pesos.marca * 10,
        },
        dados: {
          notaBruta: breakdown.scoreDados,
          peso: pesos.qualidadeDados,
          contribuicao: breakdown.scoreDados * pesos.qualidadeDados * 10,
        },
      },
      risco: {
        riscoTotal: breakdown.riscoTotal,
        roiAjustado: breakdown.roiAjustado,
        lucroAjustado: breakdown.lucroAjustado,
        kmInformada: breakdown.kmInformada,
        flagsDescricao: breakdown.flagsDescricao,
      },
      gates: {
        penalidadeRoiBaixo,
        penalidadeDadosFinanceiros,
        totalPenalidade: (penalidadeRoiBaixo ? 2 : 0) + (penalidadeDadosFinanceiros ? 2 : 0),
      },
    };
  }

  return {
    // principal
    getScore,
    getBreakdown,

    // score UI
    getScoreClass,
    getScoreIcon,

    // roi UI
    getRoiClass,
    getRoiTextClass,
    getPercentageClass,
    getLucroClass,
    getLucroTextClass,

    // detalhes
    calcularRoi,
    calcularLucroEstimado,
    getPorcentagemMercado,
    getScoreBreakdown,
    getScoreExplicacao,
  };
}
