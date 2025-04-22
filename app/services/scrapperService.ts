// services/scrapperService.ts
import type { Veiculo } from '~/types/veiculo';

/**
 * Serviço responsável por fazer scrapping de sites de leilão
 * Na implementação real, este serviço seria executado no servidor (API)
 * por questões de CORS e segurança
 */
export const scrapperService = {
    /**
     * Executa o scrapper em uma URL específica
     * @param url - URL de um leilão para fazer scrapping
     * @returns Dados do veículo extraídos
     */
    async executarScrapper(url: string): Promise<Veiculo> {
        try {
            // Verificar se a URL é de um site suportado
            if (!this.isUrlSupported(url)) {
                throw new Error('URL não suportada. Atualmente suportamos apenas os sites Parque dos Leilões e Leilo.');
            }

            // Chamar a API de extração
            const response = await fetch('/api/scrapper/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.statusMessage || 'Falha ao extrair dados do site.');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Falha ao extrair dados do site.');
            }

            // Converter a string de dataCaptura para objeto Date
            const veiculo = data.data;
            veiculo.dataCaptura = new Date(veiculo.dataCaptura);

            // Assegurar que a propriedade leiloeiro exista
            if (!veiculo.leiloeiro) {
                // Determinar o leiloeiro com base na URL
                veiculo.leiloeiro = this.determinarLeiloeiro(url);
            }

            return veiculo;
        } catch (error: any) {
            console.error('Erro no scrapper:', error);
            throw new Error(error.message || 'Ocorreu um erro ao processar a URL');
        }
    },

    /**
     * Verifica se a URL é de um site suportado pelo scrapper
     */
    isUrlSupported(url: string): boolean {
        const supportedDomains = [
            'parquedosleiloes.com.br',
            'leilo.com.br',
            // Adicionar outros domínios suportados aqui
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
    },

    /**
     * Extrai dados do site Parque dos Leilões
     * Esta é uma simulação - em produção seria um parser real
     */
    extractParqueData(url: string): Veiculo {
        // Normalmente aqui faria o parsing do HTML
        // Por enquanto apenas retornamos dados simulados

        // Gerar alguns valores randômicos para simular diferentes veículos
        const marcas = ['Toyota', 'Honda', 'Volkswagen', 'Hyundai', 'BYD', 'Fiat', 'Chevrolet'];
        const modelo = ['Corolla', 'Civic', 'Golf', 'HB20', 'Dolphin Plus', 'Toro', 'Onix'];

        const randomMarca = marcas[Math.floor(Math.random() * marcas.length)]!;
        const randomModelo = modelo[Math.floor(Math.random() * modelo.length)]!;
        const randomAno = `20${20 + Math.floor(Math.random() * 5)}/20${21 + Math.floor(Math.random() * 5)}`;
        const randomKm = Math.floor(Math.random() * 80000) + 10000;

        // Gerar valores de lances e preço de mercado
        const lanceInicial = Math.floor(Math.random() * 50000) + 50000;
        const incremento = Math.floor(Math.random() * 5000) + 5000;
        const lanceAtual = lanceInicial + incremento * (Math.floor(Math.random() * 5) + 1);
        const valorMercado = lanceAtual + Math.floor(Math.random() * 30000) + 10000;

        // Determinar leiloeiro com base na URL
        const leiloeiro = this.determinarLeiloeiro(url);

        return {
            id: Math.random().toString(36).substring(2, 15),
            descricao: randomMarca.toUpperCase() + ' ' + randomModelo.toUpperCase(),
            marca: randomMarca.toUpperCase(),
            ano: randomAno,
            // score: parseFloat((Math.random() * 2 + 7).toFixed(1)), // Score entre 7.0 e 9.0
            quilometragem: randomKm,
            sinistro: Math.random() > 0.7, // 30% de chance de ter sinistro
            lanceInicial: lanceInicial,
            lanceAtual: lanceAtual,
            valorMercado: valorMercado,
            dataCaptura: new Date(),
            urlOrigem: url,
            leiloeiro: leiloeiro,
            active: true
        };
    }
};