import type { Veiculo } from '~/types/veiculo';
import { getLeiloeiroPorUrl, isUrlSuportada } from '../../utils/leiloeiro-registry';
import { parse } from 'node-html-parser';

/**
 * API para extrair veículos sequencialmente, navegando pelos botões "próximo"
 */
export default defineEventHandler(async (event) => {
  try {
    const { url, maxVeiculos = 10 } = await readBody(event);

    if (!url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'URL inicial é obrigatória',
      });
    }

    if (!isUrlSuportada(url)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'URL não suportada.',
      });
    }

    const results: Array<{
      url: string;
      success: boolean;
      data?: Veiculo;
      error?: string;
    }> = [];

    let currentUrl = url;
    let hasNext = true;
    let count = 0;
    const maxCount = Math.min(maxVeiculos, 150);

    console.log(`Iniciando extração sequencial a partir de: ${currentUrl}`);

    while (hasNext && count < maxCount) {
      try {
        console.log(`Processando URL: ${currentUrl}`);
        const response = await fetch(currentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        if (!response.ok) {
          console.error(`Erro ao buscar URL: ${response.status} ${response.statusText}`);
          break;
        }

        const html = await response.text();
        const leiloeiro = getLeiloeiroPorUrl(currentUrl);
        if (!leiloeiro) {
          results.push({
            url: currentUrl,
            success: false,
            error: 'Leiloeiro não identificado para a URL.',
          });
          break;
        }

        const veiculo = await leiloeiro.parser(html, currentUrl);

        if (veiculo) {
          results.push({
            url: currentUrl,
            success: true,
            data: veiculo,
          });

          count++;
          console.log(`Veículo #${count} extraído com sucesso`);
        } else {
          results.push({
            url: currentUrl,
            success: false,
            error: 'Leilão cancelado ou veículo descartado',
          });

          console.log('Leilão cancelado, pulando para o próximo');
        }

        const root = parse(html);
        const nextButton = root.querySelector('.btn-next');

        if (nextButton && !nextButton.classList.contains('btn-disabled') && !nextButton.hasAttribute('disabled')) {
          const nextUrl = nextButton.getAttribute('href');

          if (nextUrl && nextUrl !== '#') {
            currentUrl = nextUrl.startsWith('http') ? nextUrl : `https://www.parquedosleiloes.com.br${nextUrl}`;
            console.log(`Link para próximo veículo encontrado: ${currentUrl}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            console.log('Link para próximo veículo não encontrado ou inválido');
            hasNext = false;
          }
        } else {
          console.log('Botão próximo não encontrado ou desabilitado, finalizando extração');
          hasNext = false;
        }
      } catch (error: any) {
        console.error(`Erro ao processar URL ${currentUrl}:`, error);
        results.push({
          url: currentUrl,
          success: false,
          error: error.message || 'Erro desconhecido ao processar URL',
        });

        hasNext = false;
      }
    }

    const successful = results.filter((r) => r.success).length;

    return {
      success: true,
      total: results.length,
      successful,
      failed: results.length - successful,
      completed: !hasNext || count >= maxCount,
      results,
    };
  } catch (error: any) {
    console.error('Erro ao realizar extração sequencial:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ocorreu um erro ao realizar a extração sequencial',
    });
  }
});
