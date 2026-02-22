import type { Leiloeiro, Veiculo } from '~/types/veiculo'
import { CONFIG_NEGOCIO } from '~/config/negocio'

export type VeiculoBreakdown = {
  // Entradas
  lance: number
  valorMercado: number
  km: number
  kmInformada: boolean

  // Custos
  custos: {
    comissaoLeilao: number
    taxaAdm: number
    taxaDespachante: number
    taxaVistoria: number
    frete: number
    ipva: number
  }
  custoTotal: number

  // Revenda
  desagioAplicado: number // 0..1
  valorVendaProjetado: number
  valorVendaLiquido: number

  // Financeiro (projetado)
  lucroProjetado: number
  roiProjetado: number

  // Risco
  riscoSinistro: number
  riscoDescricao: number
  riscoKmIncerteza: number
  riscoTotal: number
  flagsDescricao: string[]

  // Financeiro (ajustado por risco)
  lucroAjustado: number
  roiAjustado: number

  // Scores (0..1)
  scoreRoi: number
  scoreLucro: number
  scoreKm: number
  scoreMarca: number
  scoreDados: number
  scoreBase: number

  // Score final (0..10)
  scoreFinal: number

  // Classificações úteis
  roiClassificacao: 'Excelente' | 'Muito Bom' | 'Bom' | 'Regular' | 'Ruim'
}

export class VeiculoRanker {
  static rankearVeiculos(veiculos: Veiculo[]) {
    return veiculos
      .map((veiculo) => {
        const breakdown = this.calcularBreakdown(veiculo, veiculo.leiloeiro)
        return { veiculo, score: breakdown.scoreFinal, breakdown }
      })
      .sort((a, b) => b.score - a.score)
  }

  // --------------------------
  // Helpers
  // --------------------------

  private static clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
  }

  private static logistic(x: number, center: number, scale: number): number {
    return 1 / (1 + Math.exp(-(x - center) / scale))
  }

  private static normalizarTexto(s: string): string {
    return (s ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
  }

  static estimarQuilometragem(veiculo: Veiculo): { km: number; kmInformada: boolean } {
    if (veiculo.quilometragem && veiculo.quilometragem > 0) {
      return { km: veiculo.quilometragem, kmInformada: true }
    }

    // ano vem tipo "2022/2023" → usa o primeiro ano
    const anoStr = (veiculo.ano ?? '').split('/')[0]
    const anoBase = parseInt(anoStr!, 10)
    if (!anoBase || Number.isNaN(anoBase)) return { km: 0, kmInformada: false }

    const anoAtual = new Date().getFullYear()
    const anosCompletos = anoAtual - anoBase
    const anosParaEstimativa = Math.max(0, anosCompletos - 1)

    return {
      km: anosParaEstimativa * CONFIG_NEGOCIO.estimativas.kmAnual,
      kmInformada: false,
    }
  }

  private static scoreKm(km: number): number {
    if (km <= 30000) return 1
    if (km <= 210000) return 1 - ((km - 30000) / 180000)
    return 0
  }

  private static scoreMarca(marca?: string): number {
    const m = (marca ?? '').toLowerCase()

    const classificacaoMarca = {
      excelente: ['toyota', 'honda', 'hyundai', 'nissan'],
      muitoBoas: ['jeep', 'volkswagen', 'vw', 'chevrolet', 'chev', 'gm', 'fiat', 'ford', 'byd'],
      boas: ['peugeot', 'renault', 'mitsubishi', 'mmc' , 'kia'],
      regular: ['citroen', 'jac', 'i/jac', 'i/volvo', 'volvo', 'suzuki'],
      ruim: ['bmw', 'mercedes', 'm.benz', 'audi', 'land rover', 'i/lr', 'lr', 'subaru', 'mazda'],
    }

    if (classificacaoMarca.excelente.includes(m)) return 1
    if (classificacaoMarca.muitoBoas.includes(m)) return 0.8
    if (classificacaoMarca.boas.includes(m)) return 0.6
    if (classificacaoMarca.regular.includes(m)) return 0.4
    if (classificacaoMarca.ruim.includes(m)) return 0.2
    return 0
  }

  private static riscoSinistro(sinistro?: string): number {
    const s = (sinistro ?? '').toLowerCase()

    if (s === 'nenhum') return CONFIG_NEGOCIO.risco.sinistro.nenhum
    if (s.includes('indicio')) return CONFIG_NEGOCIO.risco.sinistro.indicio
    if (s.includes('recuperado')) return CONFIG_NEGOCIO.risco.sinistro.recuperado
    if (s.includes('pequena')) return CONFIG_NEGOCIO.risco.sinistro.pequena
    if (s.includes('media')) return CONFIG_NEGOCIO.risco.sinistro.media
    if (s.includes('grande') || s.includes('sucata')) return CONFIG_NEGOCIO.risco.sinistro.grande

    // conservador: trata como "pequena"
    return CONFIG_NEGOCIO.risco.sinistro.pequena
  }

  private static analisarDescricao(descricao?: string): { risco: number; flags: string[]; ajusteDesagio: number } {
    const d = this.normalizarTexto(descricao ?? '')
    const flags: string[] = []
    let risco = 1
    let ajusteDesagio = 0

    const termosMotorGrave = [
      'MOTOR DESMONTADO',
      'MOTOR FALTANDO',
      'FALTANDO PECAS',
      'FALTA PECAS',
      'FALTANDO PECA',
      'FALTA PECA',
    ]

    if (termosMotorGrave.some((t) => d.includes(t))) {
      flags.push('MOTOR/PEÇAS (grave)')
      risco = Math.min(risco, CONFIG_NEGOCIO.risco.descricao.motorGrave)
      ajusteDesagio += 0.07 // deságio extra por “incerteza/custo oculto”
    }

    if (d.includes('SEM CHAVE')) {
      flags.push('SEM CHAVE')
      risco = Math.min(risco, CONFIG_NEGOCIO.risco.descricao.semChave)
      ajusteDesagio += 0.02
    }

    return { risco, flags, ajusteDesagio }
  }

  private static ajusteDesagioPorSinistro(sinistro?: string): number {
    const s = (sinistro ?? '').toLowerCase()
    if (s.includes('recuperado')) return 0.05
    if (s.includes('indicio')) return 0.03
    if (s.includes('media')) return 0.08
    if (s.includes('pequena')) return 0.03
    return 0
  }

  private static classificarRoi(roi: number): VeiculoBreakdown['roiClassificacao'] {
    const t = CONFIG_NEGOCIO.roi
    if (roi >= t.excelente) return 'Excelente'
    if (roi >= t.muitoBom) return 'Muito Bom'
    if (roi >= t.bom) return 'Bom'
    if (roi >= t.regular) return 'Regular'
    return 'Ruim'
  }

  private static scoreRoi(roi: number): number {
    // Mapeia tiers -> 0..1 (controlável e previsível)
    const t = CONFIG_NEGOCIO.roi
    if (roi >= t.excelente) return 1
    if (roi >= t.muitoBom) return 0.9
    if (roi >= t.bom) return 0.8
    if (roi >= t.regular) return 0.6
    if (roi >= 10) return 0.3
    return 0
  }

  // --------------------------
  // Core
  // --------------------------

  private static calcularFinanceiro(
    veiculo: Veiculo,
    leiloeiro?: Leiloeiro,
    kmInformada?: boolean,
  ) {
    const valorMercado = veiculo.valorMercado ?? 0
    const lance = veiculo.lanceAtual && veiculo.lanceAtual > 0 ? veiculo.lanceAtual : veiculo.lanceInicial

    // custos leiloeiro
    const comissaoPct = (leiloeiro?.comissao ?? 5) / 100
    const taxaAdm = leiloeiro?.taxaAdm ?? 1700
    const taxaDespachante = leiloeiro?.taxaDespachante ?? 0
    const taxaVistoria = leiloeiro?.taxaVistoria ?? 0

    // custos adicionais
    const frete = (veiculo.patioUf && veiculo.patioUf !== 'DF') ? CONFIG_NEGOCIO.logistica.freteForaDF : 0
    const ipvaPago = !!(veiculo as any).ipvaPago // no seu JSON: 1/0
    const ipva = ipvaPago ? 0 : (valorMercado * CONFIG_NEGOCIO.revenda.ipvaEstimado)

    const comissaoLeilao = (lance > 0 ? lance : 0) * comissaoPct

    const custos = {
      comissaoLeilao,
      taxaAdm,
      taxaDespachante,
      taxaVistoria,
      frete,
      ipva,
    }

    const custoTotal =
      (lance > 0 ? lance : 0) +
      comissaoLeilao +
      taxaAdm +
      taxaDespachante +
      taxaVistoria +
      frete +
      ipva

    // deságio dinâmico
    const { risco: riscoDescricao, flags, ajusteDesagio } = this.analisarDescricao((veiculo as any).descricao)
    const ajusteSinistro = this.ajusteDesagioPorSinistro(veiculo.sinistro)

    // penaliza dados incompletos com leve aumento de deságio (opcional, mas ajuda)
    const ajusteDados = kmInformada ? 0 : 0.01

    const desagioBase = CONFIG_NEGOCIO.revenda.desagioPadrao
    const desagioAplicado = this.clamp(desagioBase + ajusteSinistro + ajusteDesagio + ajusteDados, 0, 0.30)

    const valorVendaProjetado = valorMercado * (1 - desagioAplicado)
    const valorVendaLiquido = valorVendaProjetado // já estamos “descontando deságio”; sem comissão adicional aqui

    const lucroProjetado = valorVendaLiquido - custoTotal
    const roiProjetado = custoTotal > 0 ? (lucroProjetado / custoTotal) * 100 : 0

    return {
      lance,
      valorMercado,
      custos,
      custoTotal,
      desagioAplicado,
      valorVendaProjetado,
      valorVendaLiquido,
      lucroProjetado,
      roiProjetado,
      riscoDescricao,
      flagsDescricao: flags,
    }
  }

  static calcularBreakdown(veiculo: Veiculo, leiloeiro?: Leiloeiro): VeiculoBreakdown {
    const { km, kmInformada } = this.estimarQuilometragem(veiculo)

    const fin = this.calcularFinanceiro(veiculo, leiloeiro, kmInformada)

    // Riscos
    const riscoSinistro = this.riscoSinistro(veiculo.sinistro)
    const riscoKmIncerteza = kmInformada ? 1 : CONFIG_NEGOCIO.risco.kmNaoInformada
    const riscoTotal = this.clamp(riscoSinistro * fin.riscoDescricao * riscoKmIncerteza, 0, 1)

    // Ajustes por risco (separa projetado vs ajustado)
    const lucroAjustado = fin.lucroProjetado * riscoTotal
    const roiAjustado = fin.roiProjetado * riscoTotal

    // Scores (0..1)
    const scoreRoi = this.scoreRoi(roiAjustado)
    const scoreLucro = this.logistic(lucroAjustado, 12000, 8000) // lucro já “risk-adjusted”
    const scoreKm = this.scoreKm(km)
    const scoreMarca = this.scoreMarca(veiculo.marca)
    const scoreDados = (fin.valorMercado > 0 && fin.lance > 0) ? 1 : 0

    const p = CONFIG_NEGOCIO.pesos
    const scoreBase =
      (scoreRoi * p.roi) +
      (scoreLucro * p.lucroAbsoluto) +
      (scoreKm * p.quilometragem) +
      (scoreMarca * p.marca) +
      (scoreDados * p.qualidadeDados)

    let scoreFinal = scoreBase * 10

    // Gates leves (opcional, mas melhora muito ranking)
    if (roiAjustado < CONFIG_NEGOCIO.roi.regular) scoreFinal = Math.max(scoreFinal - 2, 0)
    if (fin.valorMercado <= 0 || fin.lance <= 0) scoreFinal = Math.max(scoreFinal - 2, 0)

    scoreFinal = parseFloat(scoreFinal.toFixed(1))

    return {
      lance: fin.lance,
      valorMercado: fin.valorMercado,
      km,
      kmInformada,

      custos: fin.custos,
      custoTotal: fin.custoTotal,

      desagioAplicado: fin.desagioAplicado,
      valorVendaProjetado: fin.valorVendaProjetado,
      valorVendaLiquido: fin.valorVendaLiquido,

      lucroProjetado: fin.lucroProjetado,
      roiProjetado: fin.roiProjetado,

      riscoSinistro,
      riscoDescricao: fin.riscoDescricao,
      riscoKmIncerteza,
      riscoTotal,
      flagsDescricao: fin.flagsDescricao,

      lucroAjustado,
      roiAjustado,

      scoreRoi,
      scoreLucro,
      scoreKm,
      scoreMarca,
      scoreDados,
      scoreBase,

      scoreFinal,

      roiClassificacao: this.classificarRoi(roiAjustado),
    }
  }

  static calcularScore(veiculo: Veiculo, leiloeiro?: Leiloeiro): number {
    return this.calcularBreakdown(veiculo, leiloeiro).scoreFinal
  }
}