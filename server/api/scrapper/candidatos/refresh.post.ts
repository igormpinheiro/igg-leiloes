import prisma from '../../../utils/prisma';
import { calcularActive } from '../../../utils/veiculo-runtime';
import { extrairESalvarVeiculoPorUrl } from '../../../utils/extract-veiculo';

const ESPERA_MS = 1000;

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default defineEventHandler(async () => {
  try {
    const candidatos = await prisma.veiculo.findMany({
      where: { isCandidato: true },
      orderBy: [{ candidatoOrdem: 'asc' }],
    });

    const resultados: Array<{
      id: string;
      url: string;
      success: boolean;
      status: 'ok' | 'erro' | 'invalido' | 'ignorado';
      action?: string;
      message?: string;
    }> = [];

    for (const candidato of candidatos) {
      const ativo = calcularActive(candidato.dataLeilao);
      if (!ativo) {
        resultados.push({
          id: candidato.id,
          url: candidato.urlOrigem,
          success: true,
          status: 'ignorado',
          message: 'Candidato inativo, refresh ignorado.',
        });
        continue;
      }

      try {
        const refresh = await extrairESalvarVeiculoPorUrl({
          url: candidato.urlOrigem,
          dataLeilao: candidato.dataLeilao,
          deletarSeInvalido: false,
        });

        if (refresh.success) {
          await prisma.veiculo.update({
            where: { id: candidato.id },
            data: {
              candidatoStatus: 'ok',
              candidatoUltimoErro: null,
              candidatoAtualizadoEm: new Date(),
            },
          });

          resultados.push({
            id: candidato.id,
            url: candidato.urlOrigem,
            success: true,
            status: 'ok',
            action: refresh.action,
          });
        } else {
          const status = refresh.action === 'invalid' ? 'invalido' : 'erro';

          await prisma.veiculo.update({
            where: { id: candidato.id },
            data: {
              candidatoStatus: status,
              candidatoUltimoErro: refresh.reason ?? 'Falha ao atualizar candidato.',
              candidatoAtualizadoEm: new Date(),
            },
          });

          resultados.push({
            id: candidato.id,
            url: candidato.urlOrigem,
            success: false,
            status,
            action: refresh.action,
            message: refresh.reason,
          });
        }
      } catch (error: any) {
        await prisma.veiculo.update({
          where: { id: candidato.id },
          data: {
            candidatoStatus: 'erro',
            candidatoUltimoErro: error.message || 'Erro inesperado no refresh.',
            candidatoAtualizadoEm: new Date(),
          },
        });

        resultados.push({
          id: candidato.id,
          url: candidato.urlOrigem,
          success: false,
          status: 'erro',
          message: error.message || 'Erro inesperado no refresh.',
        });
      }

      await esperar(ESPERA_MS);
    }

    const sucesso = resultados.filter((item) => item.success).length;
    const falhas = resultados.length - sucesso;

    return {
      success: true,
      total: resultados.length,
      sucesso,
      falhas,
      resultados,
    };
  } catch (error: any) {
    console.error('Erro ao executar refresh de candidatos:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao executar refresh de candidatos',
    });
  }
});
