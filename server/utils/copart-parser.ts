import { TipoSinistro, type Veiculo } from '~/types/veiculo';

const COPART_API_BASE = 'https://www.copart.com.br/public/data/lotdetails/solr';

/**
 * Parser para copart.com.br
 * Usa API JSON pública ao invés de HTML scraping.
 */
export class CopartParser {
  static async parseCopart(_html: string, url: string): Promise<Veiculo | null> {
    const lotNumber = this.extrairNumeroLote(url);
    if (!lotNumber) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Número do lote não encontrado na URL da Copart.',
      });
    }

    const response = await fetch(`${COPART_API_BASE}/${lotNumber}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Erro ao acessar API da Copart: ${response.status}`,
      });
    }

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw createError({
        statusCode: 502,
        statusMessage: 'Resposta inválida da API da Copart (JSON inválido).',
      });
    }

    const data = json?.data?.lotDetails;
    if (!data) {
      throw createError({
        statusCode: 404,
        statusMessage: `Lote ${lotNumber} não encontrado na Copart.`,
      });
    }

    // Filtros de descarte
    if (this.deveDescartar(data)) {
      console.log('Veículo Copart descartado:', data.mkn, data.lm, `(damageDesc: ${data.damageDesc}, stt: ${data.stt}, vt: ${data.vt})`);
      return null;
    }

    const sinistro = this.mapearSinistro(data);
    if (sinistro === TipoSinistro.GrandeMonta || sinistro === TipoSinistro.Sucata) {
      console.log('Veículo Copart descartado por sinistro:', data.mkn, data.lm);
      return null;
    }

    const marca = (data.mkn || '').toUpperCase();
    const modelo = data.version || data.lm || '';
    const descricao = data.cmmnts || '';
    const ano = this.extrairAno(data);
    const quilometragem = Math.round(data.orr || 0);
    const valorMercado = data.la || 0;
    const lanceAtual = data.currBid || 0;
    const lanceInicial = data.bnp || lanceAtual;
    const dataLeilao = data.ad ? new Date(data.ad) : undefined;
    const numeroLote = data.ln || parseInt(lotNumber);
    const patioUf = this.extrairUf(data.yn || data.pyn || '');
    const ipvaPago = this.extrairIpvaPago(descricao);

    const veiculo: Veiculo = {
      id: Math.random().toString(36).substring(2, 15),
      modelo,
      descricao,
      marca,
      ano,
      quilometragem,
      sinistro,
      ipvaPago,
      numeroLote,
      lanceInicial,
      lanceAtual,
      valorMercado,
      dataCaptura: new Date(),
      dataLeilao,
      urlOrigem: url,
      active: false,
      leiloeiroId: 0,
      patioUf,
    };

    return veiculo;
  }

  private static extrairNumeroLote(url: string): string | null {
    const match = url.match(/\/lot\/(\d+)/);
    return match?.[1] ?? null;
  }

  private static deveDescartar(data: any): boolean {
    const damageDesc = (data.damageDesc || data.dtd || '').toLowerCase();
    const stt = (data.stt || '').toLowerCase();
    const vt = (data.vt || '').toLowerCase();

    if (damageDesc.includes('grande monta')) return true;
    if (damageDesc.includes('sucata')) return true;
    if (stt.includes('irrecuperavel') || stt.includes('irrecuperável')) return true;
    if (vt.includes('recortado')) return true;

    return false;
  }

  private static mapearSinistro(data: any): TipoSinistro {
    const desc = (data.damageDesc || data.dtd || '').toLowerCase();

    if (desc.includes('não aplicável') || desc.includes('nao aplicavel')) return TipoSinistro.Nenhum;
    if (desc.includes('pequena monta')) return TipoSinistro.PequenaMonta;
    if (desc.includes('média monta') || desc.includes('media monta')) return TipoSinistro.MediaMonta;
    if (desc.includes('grande monta')) return TipoSinistro.GrandeMonta;
    if (desc.includes('indício de sinistro') || desc.includes('indicio de sinistro')) return TipoSinistro.IndicioSinistro;
    if (desc.includes('recuperado de sinistro')) return TipoSinistro.RecuperadoSinistro;

    // Verificar stt/vt para sucata
    const stt = (data.stt || '').toLowerCase();
    const vt = (data.vt || '').toLowerCase();
    if (stt.includes('irrecuperavel') || stt.includes('irrecuperável') || vt.includes('recortado')) {
      return TipoSinistro.Sucata;
    }

    return TipoSinistro.Nenhum;
  }

  private static extrairAno(data: any): string {
    const my = data.my ? String(data.my) : '';
    const lcy = data.lcy ? String(data.lcy) : '';

    if (my && lcy && my !== lcy) {
      return `${my}/${lcy}`;
    }

    return lcy || my || '';
  }

  private static extrairUf(patio: string): string {
    const match = patio.match(/ - ([A-Z]{2})$/);
    return match?.[1] ?? '';
  }

  private static extrairIpvaPago(descricao: string): boolean {
    return /ipva\s+pago/i.test(descricao);
  }
}
