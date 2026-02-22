import { parse, HTMLElement } from 'node-html-parser';
import { TipoSinistro, type Veiculo } from '~/types/veiculo';
import { extrairValorNumerico, processarMarcaModelo } from './parser-base';

/**
 * Parser para parquedosleiloes.com.br
 */
export class LeilaoParser {
  static async parseParqueDoLeiloes(html: string, url: string): Promise<Veiculo | null> {
    try {
      const root = parse(html);

      const descricaoCompleta = this.extrairTitulo(root);
      const { marca, modelo } = processarMarcaModelo(descricaoCompleta);
      const descricao = this.extrairDescricaoLivre(root);
      const sinistro = this.extrairSinistro(root, descricao);

      if (sinistro === TipoSinistro.Sucata || sinistro === TipoSinistro.GrandeMonta) {
        console.log('Veículo descartado por ser sucata ou grande monta:', descricaoCompleta);
        return null;
      }

      const ano = this.extrairAno(root);
      const quilometragem = this.extrairQuilometragem(root);
      const valorMercado = this.extrairValorMercado(root);
      const { lanceInicial, lanceAtual } = this.extrairLances(root);

      const veiculo: Veiculo = {
        id: Math.random().toString(36).substring(2, 15),
        modelo,
        descricao,
        marca,
        ano,
        quilometragem,
        sinistro,
        ipvaPago: this.extrairIpvaPago(descricao),
        numeroLote: this.extrairNumeroLote(root),
        lanceInicial,
        lanceAtual,
        valorMercado,
        dataCaptura: new Date(),
        dataLeilao: undefined,
        urlOrigem: url,
        active: false,
        leiloeiroId: 0,
        patioUf: 'DF',
      };

      return veiculo;
    } catch (error) {
      console.error('Erro ao parsear HTML:', error);
      throw new Error('Falha ao extrair informações da página. Verifique se o formato do site mudou.');
    }
  }

  private static extrairTitulo(root: HTMLElement): string {
    return (
      root.querySelector('.title span')?.textContent.trim()
      || root.querySelector('h3.title span')?.textContent.trim()
      || root.querySelector('.auction-lot-card .name')?.textContent.trim()
      || root.querySelector('meta[property="og:description"]')?.getAttribute('content')
      || 'Veículo sem descrição'
    );
  }

  private static extrairDescricaoLivre(root: HTMLElement): string {
    const linhas = root.querySelectorAll('.auction-lot-vehicle table tr');
    for (const row of linhas) {
      const label = row.querySelector('td:first-child')?.textContent.trim().toLowerCase() || '';
      if (label.includes('descrição') || label.includes('descricao')) {
        return (row.querySelector('td:last-child')?.textContent || '').replace(/\s+/g, ' ').trim();
      }
    }

    return '';
  }

  private static extrairNumeroLote(root: HTMLElement): number | null {
    const texto = root.querySelector('.badge-nr-lot b')?.textContent || '';
    const match = texto.match(/(\d+)/);
    if (!match?.[1]) return null;

    const valor = parseInt(match[1], 10);
    return Number.isNaN(valor) ? null : valor;
  }

  private static extrairIpvaPago(descricao: string): boolean {
    return !/IPVA\s+\d{4}\s+POR\s+CONTA\s+DO\s+ARREMATANTE/i.test(descricao);
  }

  private static mapearSinistro(texto: string): TipoSinistro {
    const upper = texto.toUpperCase();
    if (upper.includes('INDICIO DE SINISTRO') || upper.includes('INDÍCIO DE SINISTRO')) {
      return TipoSinistro.IndicioSinistro;
    }
    if (
      upper.includes('RECUPERADO DE SINISTRO')
      || upper.includes('SINISTRO RECUPERADO')
      || upper.includes('SINISTRADO/RECUPERADO')
      || /RECUPERADO\s+DE\s+SINISTRO\s*-?\s*\w*\s*MONTA/.test(upper)
    ) {
      return TipoSinistro.RecuperadoSinistro;
    }
    if (upper.includes('MEDIA MONTA') || upper.includes('MÉDIA MONTA')) return TipoSinistro.MediaMonta;
    if (upper.includes('PEQUENA MONTA')) return TipoSinistro.PequenaMonta;
    if (upper.includes('GRANDE MONTA')) return TipoSinistro.GrandeMonta;
    if (upper.includes('SUCATA')) return TipoSinistro.Sucata;
    return TipoSinistro.Nenhum;
  }

  private static extrairAno(root: HTMLElement): string {
    const anoSelector = root.querySelectorAll('.auction-lot-vehicle table tr');
    let ano = '';

    for (const row of anoSelector) {
      const label = row.querySelector('td:first-child')?.textContent.trim() || '';
      if (label.includes('Ano')) {
        ano = row.querySelector('td:last-child')?.textContent.trim() || '';
        break;
      }
    }

    if (!ano) {
      const title = this.extrairTitulo(root);
      const yearPattern = /\b(19|20)\d{2}\/?(19|20)?\d{2,4}\b/;
      const yearMatch = title.match(yearPattern);
      if (yearMatch) {
        ano = yearMatch[0];
      }
    }

    return ano || 'N/A';
  }

  private static extrairQuilometragem(root: HTMLElement): number {
    const kmSelector = root.querySelectorAll('.auction-lot-vehicle table tr');

    for (const row of kmSelector) {
      const label = row.querySelector('td:first-child')?.textContent.trim() || '';
      if (label.includes('Quilometragem')) {
        const value = row.querySelector('td:last-child')?.textContent.trim() || '0';
        return parseInt(value.replace(/\D/g, ''), 10) || 0;
      }
    }

    return 0;
  }

  private static extrairSinistro(root: HTMLElement, descricaoLivre: string): TipoSinistro {
    const sinistroSelector = root.querySelectorAll('.auction-lot-vehicle table tr');

    for (const row of sinistroSelector) {
      const label = row.querySelector('td:first-child')?.textContent.trim() || '';
      if (label.includes('Sinistro')) {
        const value = row.querySelector('td:last-child')?.textContent.trim() || '';
        if (value.toLowerCase() === 'sim') {
          return this.mapearSinistro(`${value} ${descricaoLivre}`);
        }
      }
    }

    return this.mapearSinistro(descricaoLivre);
  }

  private static extrairValorMercado(root: HTMLElement): number {
    const valorSelector = root.querySelectorAll('.auction-lot-vehicle table tr');

    for (const row of valorSelector) {
      const label = row.querySelector('td:first-child')?.textContent.trim() || '';
      if (label.includes('Valor de mercado')) {
        const value = row.querySelector('td:last-child')?.textContent.trim() || '0';
        const valorMatch = value.match(/R\$\s*([\d.,]+)/);
        if (valorMatch && valorMatch[1]) {
          return parseFloat(valorMatch[1].replace(/\./g, '').replace(',', '.'));
        }
      }
    }

    return 0;
  }

  private static extrairLances(root: HTMLElement): { lanceInicial: number; lanceAtual: number } {
    let lanceInicialText = root.querySelector('.bid-item[data-name="min_bid_value"] span')?.textContent || '';
    let lanceAtualText = root.querySelector('.bid-item[data-name="highest_bid"] span')?.textContent || '';

    if (!lanceInicialText) {
      const lanceInicialElement = root.querySelector('*:contains("Lance inicial")');
      if (lanceInicialElement) {
        const nextElement = lanceInicialElement.nextElementSibling;
        if (nextElement) {
          lanceInicialText = nextElement.textContent || '';
        }
      }
    }

    if (!lanceAtualText) {
      const lanceAtualElement = root.querySelector('*:contains("Maior lance")');
      if (lanceAtualElement) {
        const nextElement = lanceAtualElement.nextElementSibling;
        if (nextElement) {
          lanceAtualText = nextElement.textContent || '';
        }
      }
    }

    const lanceInicial = extrairValorNumerico(lanceInicialText);
    const lanceAtual = extrairValorNumerico(lanceAtualText);

    return { lanceInicial, lanceAtual };
  }
}
