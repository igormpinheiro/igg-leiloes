import { isUrlSuportada } from '../../utils/leiloeiro-registry';
import { extrairESalvarVeiculoPorUrl } from '../../utils/extract-veiculo';

export default defineEventHandler(async (event) => {
  try {
    const { url, dataLeilao } = await readBody(event);

    if (!url) {
      throw createError({ statusCode: 400, statusMessage: 'URL é obrigatória' });
    }

    if (!isUrlSuportada(url)) {
      throw createError({ statusCode: 400, statusMessage: 'URL não suportada. Atualmente só suportamos os sites Parque dos Leilões e Leilo.' });
    }

    const result = await extrairESalvarVeiculoPorUrl({
      url,
      dataLeilao,
      deletarSeInvalido: true,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.reason || 'Leilão cancelado, inválido ou veículo descartado.',
        action: 'deleted' as const,
        nextUrl: result.nextUrl,
      };
    }

    return {
      success: true,
      data: result.data,
      action: result.action,
      nextUrl: result.nextUrl,
    };
  } catch (error: any) {
    console.error('Erro ao extrair dados:', error);
    if (error?.statusCode && error?.statusMessage) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ocorreu um erro ao extrair os dados da página',
    });
  }
});
