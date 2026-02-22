import type { Leiloeiro, Veiculo } from '~/types/veiculo';
import { VeiculoRanker } from '~/services/veiculoRankerService';
import { CONFIG_NEGOCIO } from '~/config/negocio';

const TAXAS_PADRAO = {
  comissao: 5,
  taxaAdm: 1700,
  taxaDespachante: 0,
  taxaVistoria: 0,
} as const;

function getCustosLeiloeiro(leiloeiro?: Leiloeiro) {
  return {
    comissao: leiloeiro?.comissao ?? TAXAS_PADRAO.comissao,
    taxaAdm: leiloeiro?.taxaAdm ?? TAXAS_PADRAO.taxaAdm,
    taxaDespachante: leiloeiro?.taxaDespachante ?? TAXAS_PADRAO.taxaDespachante,
    taxaVistoria: leiloeiro?.taxaVistoria ?? TAXAS_PADRAO.taxaVistoria,
  };
}

export function useVeiculoScore() {
  const { score, porcentagem, lucro } = CONFIG_NEGOCIO;

  function getScore(veiculo: Veiculo): number {
    return VeiculoRanker.calcularScore(veiculo, veiculo.leiloeiro);
  }

  function getScoreClass(scoreValue: number): string {
    if (scoreValue >= score.excelente) return 'bg-green-100 text-green-800';
    if (scoreValue >= score.muitoBom) return 'bg-blue-100 text-blue-800';
    if (scoreValue >= score.bom) return 'bg-yellow-100 text-yellow-800';
    if (scoreValue >= score.regular) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }

  function getScoreIcon(scoreValue: number): string {
    if (scoreValue >= score.excelente) return '🏆';
    if (scoreValue >= score.muitoBom) return '🥈';
    if (scoreValue >= score.bom) return '🥉';
    if (scoreValue >= score.regular) return '⚠️';
    return '❌';
  }

  function getPercentageClass(percentage: number): string {
    if (percentage < porcentagem.excelente) return 'bg-green-500 text-white font-bold';
    if (percentage < porcentagem.muitoBom) return 'bg-green-200 text-green-900';
    if (percentage < porcentagem.bom) return 'bg-blue-100 text-blue-800';
    if (percentage < porcentagem.regular) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  function getPorcentagemMercado(veiculo: Veiculo): number {
    if (!veiculo.valorMercado) return 0;
    const valorVeiculo = veiculo.lanceAtual > 0 ? veiculo.lanceAtual : veiculo.lanceInicial;
    return Math.round((valorVeiculo / veiculo.valorMercado) * 100);
  }

  function calcularLucroEstimado(veiculo: Veiculo, leiloeiro?: Leiloeiro): number {
    if (!veiculo.valorMercado) return 0;

    const taxas = getCustosLeiloeiro(leiloeiro ?? veiculo.leiloeiro);
    const lance = veiculo.lanceAtual > 0 ? veiculo.lanceAtual : veiculo.lanceInicial;
    const taxaLeilao = lance * (taxas.comissao / 100);
    const custoTotal = lance + taxaLeilao + taxas.taxaAdm + taxas.taxaDespachante + taxas.taxaVistoria;
    const valorVendaLiquido = veiculo.valorMercado - (veiculo.valorMercado * CONFIG_NEGOCIO.comissaoVenda);
    return valorVendaLiquido - custoTotal;
  }

  function calcularRoi(veiculo: Veiculo, leiloeiro?: Leiloeiro): number {
    const investimento = veiculo.lanceAtual > 0 ? veiculo.lanceAtual : veiculo.lanceInicial;
    if (!investimento || investimento <= 0) return 0;
    const lucroEstimado = calcularLucroEstimado(veiculo, leiloeiro);
    return (lucroEstimado / investimento) * 100;
  }

  function getRoiClass(roiValue: number): string {
    if (roiValue >= 45) return 'bg-green-500 text-white font-bold';
    if (roiValue >= 40) return 'bg-green-200 text-green-900';
    if (roiValue >= 35) return 'bg-blue-100 text-blue-800';
    if (roiValue >= 30) return 'bg-orange-100 text-orange-800';
    if (roiValue >= 20) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  function getRoiTextClass(roiValue: number): string {
    if (roiValue >= 45) return 'text-white font-bold';
    if (roiValue >= 40) return 'text-green-900 font-bold';
    if (roiValue >= 35) return 'text-blue-600 font-bold';
    if (roiValue >= 30) return 'text-yellow-600 font-bold';
    if (roiValue >= 20) return 'text-orange-600 font-bold';
    return 'text-red-600 font-bold';
  }

  function getLucroClass(lucroValue: number): string {
    if (lucroValue >= lucro.excelente) return 'bg-green-100 text-green-800';
    if (lucroValue >= lucro.bom) return 'bg-blue-100 text-blue-800';
    if (lucroValue >= 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  function getLucroTextClass(lucroValue: number): string {
    if (lucroValue >= lucro.excelente) return 'text-green-600 font-bold';
    if (lucroValue >= lucro.bom) return 'text-blue-600 font-bold';
    if (lucroValue >= 0) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  }

  return {
    getScore,
    getScoreClass,
    getScoreIcon,
    getPercentageClass,
    getPorcentagemMercado,
    calcularLucroEstimado,
    calcularRoi,
    getRoiClass,
    getRoiTextClass,
    getLucroClass,
    getLucroTextClass,
  };
}
