import prisma from '../../../utils/prisma';
import { calcularLanceLimite } from '../../../utils/lance-limite';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const incrementoGlobal = Number(body?.incrementoGlobal);

    if (!Number.isFinite(incrementoGlobal) || incrementoGlobal <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'incrementoGlobal deve ser um número maior que zero.',
      });
    }

    const candidatos = await prisma.veiculo.findMany({
      where: { isCandidato: true },
      select: {
        id: true,
        valorMercado: true,
        lanceAtual: true,
        lanceInicial: true,
      },
    });

    let atualizados = 0;

    await prisma.$transaction(
      candidatos.map((veiculo) => {
        const lanceLimite = calcularLanceLimite({
          valorMercado: veiculo.valorMercado,
          lanceAtual: veiculo.lanceAtual,
          lanceInicial: veiculo.lanceInicial,
          incremento: incrementoGlobal,
        });

        if (lanceLimite === null) {
          return prisma.veiculo.update({
            where: { id: veiculo.id },
            data: {
              candidatoAtualizadoEm: new Date(),
            },
          });
        }

        atualizados += 1;

        return prisma.veiculo.update({
          where: { id: veiculo.id },
          data: {
            lanceLimite,
            candidatoAtualizadoEm: new Date(),
          },
        });
      }),
    );

    return {
      success: true,
      total: candidatos.length,
      atualizados,
      incrementoGlobal,
    };
  } catch (error: any) {
    console.error('Erro ao recalcular lance limite dos candidatos:', error);

    if (error?.statusCode && error?.statusMessage) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao recalcular lance limite dos candidatos',
    });
  }
});
