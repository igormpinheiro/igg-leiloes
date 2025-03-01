// server/api/scrapper/extract.post.ts
import type { Veiculo } from '~/types/veiculo';
import { LeilaoParser } from '../../utils/scrapper-parser';
import { VeiculoRanker } from '~/services/veiculoRankerService';

export default defineEventHandler(async (event) => {
    try {
        const { url } = await readBody(event);

        if (!url) {
            return createError({
                statusCode: 400,
                statusMessage: 'URL é obrigatória'
            });
        }

        // Verificar se a URL é de um site suportado
        if (!url.includes('parquedosleiloes.com.br')) {
            return createError({
                statusCode: 400,
                statusMessage: 'URL não suportada. Atualmente só suportamos o site Parque dos Leilões.'
            });
        }

        // Fazer a requisição para a URL e obter o HTML
        console.log(`Fazendo requisição para: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Erro ao buscar URL: ${response.status} ${response.statusText}`);
            return createError({
                statusCode: 500,
                statusMessage: `Não foi possível acessar a URL. Status: ${response.status}`
            });
        }

        const html = await response.text();
        console.log(`Recebido HTML com ${html.length} caracteres`);

        // Usar o parser avançado para extrair os dados
        const veiculo = await LeilaoParser.parseParqueDoLeiloes(html, url);

        if (!veiculo) {
            console.log('Leilão cancelado ou inválido, nenhum veículo extraído');
            return {
                success: false,
                message: 'Leilão cancelado ou sem lance inicial. Nenhum veículo extraído.'
            };
        }

        console.log('Veículo extraído com sucesso:', veiculo);

        return {
            success: true,
            data: veiculo
        };

    } catch (error: any) {
        console.error('Erro ao extrair dados:', error);

        return createError({
            statusCode: 500,
            statusMessage: error.message || 'Ocorreu um erro ao extrair os dados da página'
        });
    }
});