import type { Veiculo } from '~/types/veiculo';
import { getLeiloeiroPorUrl, isUrlSuportada } from '../../utils/leiloeiro-registry';

export default defineEventHandler(async (event) => {
  try {
    const { urls } = await readBody(event);

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'É necessário enviar uma lista de URLs',
      });
    }

    const maxUrls = 10;
    const processUrls = urls.slice(0, maxUrls);

    if (urls.length > maxUrls) {
      console.warn(`Limitando o processamento para ${maxUrls} URLs de ${urls.length}`);
    }

    const results: Array<{
      url: string;
      success: boolean;
      data?: Veiculo;
      error?: string;
    }> = [];

    for (const url of processUrls) {
      try {
        if (!isUrlSuportada(url)) {
          results.push({
            url,
            success: false,
            error: 'URL não suportada.',
          });
          continue;
        }

        console.log(`Fazendo requisição para: ${url}`);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        if (!response.ok) {
          results.push({
            url,
            success: false,
            error: `Não foi possível acessar a URL. Status: ${response.status}`,
          });
          continue;
        }

        const html = await response.text();
        const leiloeiro = getLeiloeiroPorUrl(url);
        if (!leiloeiro) {
          results.push({
            url,
            success: false,
            error: 'Leiloeiro não identificado para a URL.',
          });
          continue;
        }

        const veiculo = await leiloeiro.parser(html, url);

        if (!veiculo) {
          results.push({
            url,
            success: false,
            error: 'Leilão cancelado ou veículo descartado',
          });
          continue;
        }

        results.push({
          url,
          success: true,
          data: veiculo,
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`Erro ao processar URL ${url}:`, error);
        results.push({
          url,
          success: false,
          error: error.message || 'Erro desconhecido ao processar URL',
        });
      }
    }

    const successful = results.filter((r) => r.success).length;

    return {
      success: true,
      total: processUrls.length,
      successful,
      failed: processUrls.length - successful,
      results,
    };
  } catch (error: any) {
    console.error('Erro ao processar o lote de URLs:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ocorreu um erro ao processar o lote de URLs',
    });
  }
});
