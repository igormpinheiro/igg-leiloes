// services/scrapperService.ts
import type { Veiculo } from '~/types/veiculo';

export interface ExtractResult {
    veiculo: Veiculo | null;
    action: 'created' | 'updated' | 'deleted';
    nextUrl: string | null;
}

export const scrapperService = {
    /**
     * Executa o scrapper em uma URL específica (com auto-save no servidor)
     * @param url - URL de um leilão para fazer scrapping
     * @param dataLeilao - Data do leilão (opcional - será extraída automaticamente se não fornecida para Leilo)
     * @returns Dados do veículo extraídos, ação realizada e URL do próximo lote
     */
    async executarScrapper(url: string, dataLeilao?: string): Promise<ExtractResult> {
        // Verificar se a URL é de um site suportado
        if (!this.isUrlSupported(url)) {
            throw new Error('URL não suportada. Atualmente suportamos apenas os sites Parque dos Leilões e Leilo.');
        }

        // Chamar a API de extração (que agora faz auto-save)
        // dataLeilao é opcional - será extraída automaticamente se não fornecida (para Leilo)
        const body: any = { url };
        if (dataLeilao) {
            body.dataLeilao = dataLeilao;
        }

        const response = await fetch('/api/scrapper/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.statusMessage || 'Falha ao extrair dados do site.');
        }

        const data = await response.json();

        // Lote cancelado/sucata — retornar sem veículo
        if (!data.success) {
            return {
                veiculo: null,
                action: data.action || 'deleted',
                nextUrl: data.nextUrl || null
            };
        }

        // Converter dataCaptura e dataLeilao para Date
        const veiculo = data.data;
        veiculo.dataCaptura = new Date(veiculo.dataCaptura);
        if (veiculo.dataLeilao) {
            veiculo.dataLeilao = new Date(veiculo.dataLeilao);
        }

        // Assegurar que a propriedade leiloeiro exista
        if (!veiculo.leiloeiro) {
            veiculo.leiloeiro = this.determinarLeiloeiro(url);
        }

        return {
            veiculo,
            action: data.action || 'created',
            nextUrl: data.nextUrl || null
        };
    },

    /**
     * Extrai URLs de lotes de uma listagem
     * @param url - URL da listagem
     * @param fullExtraction - Se true, usa Puppeteer para 100% dos lotes (mais lento); se false, usa HTML scraping (~60%)
     * @returns Objeto com URLs dos lotes, data do leilão e metadados
     */
    async extrairListagem(url: string, fullExtraction: boolean = true): Promise<{
        success: boolean;
        total: number;
        loteUrls: string[];
        dataLeilao?: string;
        method?: string;
        warning?: string;
    }> {
        const response = await fetch('/api/scrapper/extract-listing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, fullExtraction })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.statusMessage || 'Falha ao extrair listagem');
        }

        return await response.json();
    },

    /**
     * Verifica se a URL é de um site suportado pelo scrapper
     */
    isUrlSupported(url: string): boolean {
        const supportedDomains = [
            'parquedosleiloes.com.br',
            'leilo.com.br',
        ];

        return supportedDomains.some(domain => url.includes(domain));
    },

    /**
     * Determina o leiloeiro com base na URL
     */
    determinarLeiloeiro(url: string): string {
        if (url.includes('parquedosleiloes.com.br')) {
            return 'Parque dos Leilões';
        } else if (url.includes('leilo.com.br')) {
            return 'Leilo';
        }
        return 'Desconhecido';
    }
};
