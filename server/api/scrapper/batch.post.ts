// server/api/scrapper/batch.post.ts
import type { Veiculo } from '~/types/veiculo';
import { LeilaoParser } from '../../utils/scrapper-parser';
import { VeiculoRanker } from '~/services/veiculoRankerService';

export default defineEventHandler(async (event) => {
    try {
        const { urls } = await readBody(event);

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'É necessário enviar uma lista de URLs'
            });
        }

        // Limitar o número de URLs para evitar sobrecarga
        const maxUrls = 10;
        const processUrls = urls.slice(0, maxUrls);

        if (urls.length > maxUrls) {
            console.warn(`Limitando o processamento para ${maxUrls} URLs de ${urls.length}`);
        }

        // Array para armazenar os resultados
        const results: Array<{
            url: string;
            success: boolean;
            data?: Veiculo;
            error?: string;
        }> = [];

        // Processar cada URL sequencialmente para não sobrecarregar o servidor
        for (const url of processUrls) {
            try {
                if (!url.includes('parquedosleiloes.com.br')) {
                    results.push({
                        url,
                        success: false,
                        error: 'URL não suportada. Atualmente só suportamos o site Parque dos Leilões.'
                    });
                    continue;
                }

                // Fazer a requisição para a URL
                console.log(`Fazendo requisição para: ${url}`);
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                if (!response.ok) {
                    results.push({
                        url,
                        success: false,
                        error: `Não foi possível acessar a URL. Status: ${response.status}`
                    });
                    continue;
                }

                const html = await response.text();
                console.log(`Recebido HTML de ${url} com ${html.length} caracteres`);

                const veiculo = await LeilaoParser.parseParqueDoLeiloes(html, url);

                // Se o veículo for nulo (leilão cancelado), pular
                if (!veiculo) {
                    results.push({
                        url,
                        success: false,
                        error: 'Leilão cancelado ou sem lance inicial'
                    });
                    continue;
                }

                // Adicionar ao resultado
                results.push({
                    url,
                    success: true,
                    data: veiculo
                });

                // Aguardar um curto intervalo para não sobrecarregar o servidor alvo
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error: any) {
                console.error(`Erro ao processar URL ${url}:`, error);
                results.push({
                    url,
                    success: false,
                    error: error.message || 'Erro desconhecido ao processar URL'
                });
            }
        }

        // Calcular estatísticas
        const successful = results.filter(r => r.success).length;

        return {
            success: true,
            total: processUrls.length,
            successful,
            failed: processUrls.length - successful,
            results
        };

    } catch (error: any) {
        console.error('Erro ao processar o lote de URLs:', error);

        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Ocorreu um erro ao processar o lote de URLs'
        });
    }
});