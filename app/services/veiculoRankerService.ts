import type { Leiloeiro, Veiculo } from '~/types/veiculo';
import { CONFIG_NEGOCIO } from '~/config/negocio';

/**
 * Serviço responsável por calcular e rankear os veículos com base em diversos fatores.
 */
export class VeiculoRanker {
  static rankearVeiculos(veiculos: Veiculo[]): Array<{ veiculo: Veiculo; score: number }> {
    return veiculos
      .map((veiculo) => ({
        veiculo,
        score: this.calcularScore(veiculo, veiculo.leiloeiro),
      }))
      .sort((a, b) => b.score - a.score);
  }

  static estimarQuilometragem(veiculo: Veiculo): number {
    if (veiculo.quilometragem && veiculo.quilometragem > 0) {
      return veiculo.quilometragem;
    }

    if (!veiculo.ano) {
      return 0;
    }

    const anoAtual = new Date().getFullYear();
    const anoBase = parseInt(veiculo.ano, 10);
    if (Number.isNaN(anoBase)) return 0;

    const anosCompletos = anoAtual - anoBase;
    const anosParaEstimativa = Math.max(0, anosCompletos - 1);

    return anosParaEstimativa * CONFIG_NEGOCIO.kmAnualEstimado;
  }

  private static calcularLucroEstimado(veiculo: Veiculo, leiloeiro?: Leiloeiro): number {
    if (!veiculo.valorMercado) return 0;

    const lance = veiculo.lanceAtual || veiculo.lanceInicial;
    const comissaoLeilao = (leiloeiro?.comissao ?? 5) / 100;
    const taxaAdm = leiloeiro?.taxaAdm ?? 1700;
    const taxaDespachante = leiloeiro?.taxaDespachante ?? 0;
    const taxaVistoria = leiloeiro?.taxaVistoria ?? 0;

    const custoTotal = lance + (lance * comissaoLeilao) + taxaAdm + taxaDespachante + taxaVistoria;
    const valorVendaLiquido = veiculo.valorMercado - (veiculo.valorMercado * CONFIG_NEGOCIO.comissaoVenda);

    return valorVendaLiquido - custoTotal;
  }

  static calcularScore(veiculo: Veiculo, leiloeiro?: Leiloeiro): number {
    const maiorLance = veiculo.lanceAtual || veiculo.lanceInicial;
    const valorMercado = veiculo.valorMercado || 0;
    const quilometragem = this.estimarQuilometragem(veiculo);
    const marca = veiculo.marca?.toLowerCase() || '';

    const lucroBruto = this.calcularLucroEstimado(veiculo, leiloeiro);
    const percentualLucro = maiorLance > 0 ? (lucroBruto / maiorLance) * 100 : 0;

    let scoreLucroBruto: number;
    if (lucroBruto >= 10000) {
      scoreLucroBruto = Math.min((lucroBruto - 10000) / (30000 - 10000), 1);
    } else {
      scoreLucroBruto = Math.max((lucroBruto - 5000) / (10000 - 5000), 0) * 0.5;
    }

    let scorePercentualLucro = 0;
    if (lucroBruto >= 10000) {
      scorePercentualLucro = Math.min((percentualLucro - 30) / (50 - 30), 1);
      scorePercentualLucro = Math.max(scorePercentualLucro, 0);
    }

    let scoreQuilometragem: number;
    if (quilometragem <= 30000) {
      scoreQuilometragem = 1;
    } else if (quilometragem <= 210000) {
      scoreQuilometragem = 1 - ((quilometragem - 30000) / 180000);
    } else {
      scoreQuilometragem = 0;
    }

    const classificacaoMarca = {
      excelente: ['toyota', 'honda', 'hyundai', 'nissan'],
      muitoBoas: ['jeep', 'volkswagen', 'vw', 'mitsubishi', 'mmc', 'byd'],
      boas: ['chevrolet', 'chev', 'gm', 'fiat', 'renault', 'ford', 'kia'],
      regular: ['citroen', 'peugeot', 'jac', 'i/jac', 'i/volvo', 'volvo', 'suzuki'],
      ruim: ['bmw', 'mercedes', 'm.benz', 'audi', 'land rover', 'i/lr', 'lr', 'subaru', 'mazda'],
    };

    let scoreMarca: number;
    if (classificacaoMarca.excelente.includes(marca)) {
      scoreMarca = 1;
    } else if (classificacaoMarca.muitoBoas.includes(marca)) {
      scoreMarca = 0.8;
    } else if (classificacaoMarca.boas.includes(marca)) {
      scoreMarca = 0.6;
    } else if (classificacaoMarca.regular.includes(marca)) {
      scoreMarca = 0.4;
    } else if (classificacaoMarca.ruim.includes(marca)) {
      scoreMarca = 0.2;
    } else {
      scoreMarca = 0;
    }

    const penalizacaoSinistro = veiculo.sinistro !== 'Nenhum' ? 0 : 1;

    const scoreBase =
      (scoreLucroBruto * 0.35)
      + (scorePercentualLucro * 0.25)
      + (scoreQuilometragem * 0.2)
      + (penalizacaoSinistro * 0.1)
      + (scoreMarca * 0.15);

    let scoreFinal = scoreBase * 10;

    if (lucroBruto < 10000) {
      scoreFinal = Math.max(scoreFinal - 2, 0);
    }
    if (quilometragem > 210000) {
      scoreFinal = Math.max(scoreFinal - 1, 0);
    }
    if (quilometragem > 250000) {
      scoreFinal = Math.max(scoreFinal - 1, 0);
    }

    if (!valorMercado || maiorLance <= 0) {
      scoreFinal = Math.max(scoreFinal - 2, 0);
    }

    return parseFloat(scoreFinal.toFixed(1));
  }
}
