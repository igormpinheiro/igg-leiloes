// server/utils/scrapper-parser.ts
import { parse, HTMLElement } from 'node-html-parser';
import type { Veiculo } from '~/types/veiculo';
import { VeiculoRanker } from '~/services/veiculoRankerService';

/**
 * Classe para parsear sites de leilões e extrair informações de veículos
 */
export class LeilaoParser {
    /**
     * Parseia uma página de leilão e extrai informações do veículo
     * @param html HTML da página
     * @param url URL original
     * @returns Objeto com dados do veículo
     */
    static async parseParqueDoLeiloes(html: string, url: string): Promise<Veiculo> {
        try {
            const root = parse(html);

            // Extrações básicas
            const descricaoCompleta = this.extrairTitulo(root);
            const { marca, descricao } = this.processarDescricao(descricaoCompleta);
            const ano = this.extrairAno(root);
            const quilometragem = this.extrairQuilometragem(root);
            const sinistro = this.extrairSinistro(root);
            const valorMercado = this.extrairValorMercado(root);
            const { lanceInicial, lanceAtual } = this.extrairLances(root);

            // Calcular score com base nos dados extraídos
            const score = VeiculoRanker.calcularScore({
                id: Math.random().toString(36).substring(2, 15),
                descricao,
                marca,
                ano,
                quilometragem,
                sinistro,
                lanceInicial: this.extrairLances(root).lanceInicial,
                lanceAtual: this.extrairLances(root).lanceAtual,
                valorMercado,
                dataCaptura: new Date(),
                urlOrigem: url,
                active: true
            });

            // Construir objeto Veiculo
            const veiculo: Veiculo = {
                id: Math.random().toString(36).substring(2, 15),
                descricao,
                marca,
                ano,
                score,
                quilometragem,
                sinistro,
                lanceInicial,
                lanceAtual,
                valorMercado,
                dataCaptura: new Date(),
                urlOrigem: url
            };

            return veiculo;
        } catch (error) {
            console.error('Erro ao parsear HTML:', error);
            throw new Error('Falha ao extrair informações da página. Verifique se o formato do site mudou.');
        }
    }

    /**
     * Extrai o título/nome do veículo
     */
    private static extrairTitulo(root: HTMLElement): string {
        // Tenta várias possíveis localizações do título
        return (
            root.querySelector('.title span')?.textContent.trim() ||
            root.querySelector('h3.title span')?.textContent.trim() ||
            root.querySelector('.auction-lot-card .name')?.textContent.trim() ||
            root.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
            'Veículo sem descrição'
        );
    }

    /**
     * Processa a descrição para separar marca e descrição
     */
    private static processarDescricao(descricaoCompleta: string): { marca: string, descricao: string } {
        let marca = '';
        let descricao = descricaoCompleta;

        // Padrões comuns em descrições de veículos
        const marcasConhecidas = ['FIAT', 'VOLKSWAGEN', 'VW', 'TOYOTA', 'HONDA', 'HYUNDAI', 'CHEVROLET', 'FORD', 'RENAULT', 'NISSAN', 'BMW', 'MERCEDES', 'AUDI', 'BYD', 'JEEP', 'LAND ROVER', 'MITSUBISHI', 'KIA', 'PEUGEOT', 'CITROEN', 'YAMAHA', 'HONDA', 'SUZUKI', 'KAWASAKI'];

        // Verificar se a descrição começa com alguma marca conhecida
        for (const marcaConhecida of marcasConhecidas) {
            if (descricaoCompleta.toUpperCase().startsWith(marcaConhecida)) {
                marca = marcaConhecida;
                descricao = descricaoCompleta.substring(marcaConhecida.length).trim();
                return { marca, descricao };
            } else if (descricaoCompleta.toUpperCase().includes(marcaConhecida)) {
                // Se a descrição contém a marca em algum lugar
                marca = marcaConhecida;
            }
        }

        // Se não encontrou uma marca específica, usar o primeiro "token" como marca
        if (!marca && descricaoCompleta.includes(' ')) {
            const partes = descricaoCompleta.split(' ');
            marca = partes[0];
            descricao = partes.slice(1).join(' ');
        }

        // Se a marca começar com caracteres especiais como "***", removê-los
        marca = marca.replace(/^\*+\s*/, '');

        return { marca, descricao };
    }

    /**
     * Extrai o ano do veículo
     */
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

        // Formatação adicional se necessário
        if (!ano) {
            // Tentar extrair ano diretamente do título
            const title = this.extrairTitulo(root);
            const yearPattern = /\b(19|20)\d{2}\/?(19|20)?\d{2,4}\b/;
            const yearMatch = title.match(yearPattern);
            if (yearMatch) {
                ano = yearMatch[0];
            }
        }

        return ano || 'N/A';
    }

    /**
     * Extrai a quilometragem do veículo
     */
    private static extrairQuilometragem(root: HTMLElement): number {
        const kmSelector = root.querySelectorAll('.auction-lot-vehicle table tr');
        let quilometragem = 0;

        for (const row of kmSelector) {
            const label = row.querySelector('td:first-child')?.textContent.trim() || '';
            if (label.includes('Quilometragem')) {
                const value = row.querySelector('td:last-child')?.textContent.trim() || '0';
                quilometragem = parseInt(value.replace(/\D/g, '')) || 0;
                break;
            }
        }

        return quilometragem;
    }

    /**
     * Extrai informação de sinistro
     */
    private static extrairSinistro(root: HTMLElement): boolean {
        const sinistroSelector = root.querySelectorAll('.auction-lot-vehicle table tr');
        let sinistro = false;

        for (const row of sinistroSelector) {
            const label = row.querySelector('td:first-child')?.textContent.trim() || '';
            if (label.includes('Sinistro')) {
                const value = row.querySelector('td:last-child')?.textContent.trim() || '';
                sinistro = value.toLowerCase() === 'sim';
                break;
            }
        }

        return sinistro;
    }

    /**
     * Extrai o valor de mercado do veículo
     */
    private static extrairValorMercado(root: HTMLElement): number {
        const valorSelector = root.querySelectorAll('.auction-lot-vehicle table tr');
        let valorMercado = 0;

        for (const row of valorSelector) {
            const label = row.querySelector('td:first-child')?.textContent.trim() || '';
            if (label.includes('Valor de mercado')) {
                const value = row.querySelector('td:last-child')?.textContent.trim() || '0';
                // Extrair valor numérico de strings como "R$ 141.506,00 / fevereiro de 2025"
                const valorMatch = value.match(/R\$\s*([\d.,]+)/);
                if (valorMatch && valorMatch[1]) {
                    valorMercado = parseFloat(valorMatch[1].replace(/\./g, '').replace(',', '.'));
                }
                break;
            }
        }

        return valorMercado;
    }

    /**
     * Extrai valores de lances
     */
    private static extrairLances(root: HTMLElement): { lanceInicial: number, lanceAtual: number } {
        // Tentar extrair do formato de bid-item
        let lanceInicialText = root.querySelector('.bid-item[data-name="min_bid_value"] span')?.textContent || '';
        let lanceAtualText = root.querySelector('.bid-item[data-name="highest_bid"] span')?.textContent || '';

        // Se não encontrar, tentar outras formas
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

        // Extrair valores numéricos dos lances
        const lanceInicial = this.extrairValorNumerico(lanceInicialText);
        const lanceAtual = this.extrairValorNumerico(lanceAtualText);

        return { lanceInicial, lanceAtual };
    }

    /**
     * Extrai um valor numérico de uma string (ex: "R$ 10.000,00" -> 10000)
     */
    private static extrairValorNumerico(texto: string): number {
        if (!texto) return 0;

        // Remover símbolos não numéricos exceto vírgula e ponto
        const valor = texto.replace(/[^\d,\.]/g, '');

        // Converter formato brasileiro (1.000,00) para número
        if (valor.includes(',')) {
            return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
        }

        return parseFloat(valor) || 0;
    }
}