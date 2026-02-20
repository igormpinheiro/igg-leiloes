// server/utils/scrapper-parser.ts
import { parse, HTMLElement } from 'node-html-parser';
import type { Veiculo } from '~/types/veiculo';
import { extrairValorNumerico, processarDescricao } from './parser-base';

/**
 * Parser para parquedosleiloes.com.br
 */
export class LeilaoParser {
    static async parseParqueDoLeiloes(html: string, url: string): Promise<Veiculo> {
        try {
            const root = parse(html);

            const descricaoCompleta = this.extrairTitulo(root);
            const { marca, descricao } = processarDescricao(descricaoCompleta);
            const ano = this.extrairAno(root);
            const quilometragem = this.extrairQuilometragem(root);
            const sinistro = this.extrairSinistro(root);
            const valorMercado = this.extrairValorMercado(root);
            const { lanceInicial, lanceAtual } = this.extrairLances(root);

            const veiculo: Veiculo = {
                id: Math.random().toString(36).substring(2, 15),
                descricao,
                marca,
                ano,
                quilometragem,
                sinistro,
                lanceInicial,
                lanceAtual,
                valorMercado,
                dataCaptura: new Date(),
                urlOrigem: url,
                active: true,
                leiloeiro: 'parquedosleiloes',
                patioUf: 'DF'
            };

            return veiculo;
        } catch (error) {
            console.error('Erro ao parsear HTML:', error);
            throw new Error('Falha ao extrair informações da página. Verifique se o formato do site mudou.');
        }
    }

    private static extrairTitulo(root: HTMLElement): string {
        return (
            root.querySelector('.title span')?.textContent.trim() ||
            root.querySelector('h3.title span')?.textContent.trim() ||
            root.querySelector('.auction-lot-card .name')?.textContent.trim() ||
            root.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
            'Veículo sem descrição'
        );
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
                return parseInt(value.replace(/\D/g, '')) || 0;
            }
        }

        return 0;
    }

    private static extrairSinistro(root: HTMLElement): boolean {
        const sinistroSelector = root.querySelectorAll('.auction-lot-vehicle table tr');

        for (const row of sinistroSelector) {
            const label = row.querySelector('td:first-child')?.textContent.trim() || '';
            if (label.includes('Sinistro')) {
                const value = row.querySelector('td:last-child')?.textContent.trim() || '';
                return value.toLowerCase() === 'sim';
            }
        }

        return false;
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

    private static extrairLances(root: HTMLElement): { lanceInicial: number, lanceAtual: number } {
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
