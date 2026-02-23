import prisma from '../../../utils/prisma';
import { calcularActive } from '../../../utils/veiculo-runtime';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do veículo não fornecido',
      });
    }

    const body = await readBody(event);
    const lanceLimite = Number(body?.lanceLimite);

    if (!Number.isFinite(lanceLimite) || lanceLimite <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'lanceLimite deve ser um número maior que zero',
      });
    }

    const atualizado = await prisma.veiculo.update({
      where: { id },
      data: {
        lanceLimite,
        candidatoAtualizadoEm: new Date(),
      },
      include: {
        leiloeiro: true,
      },
    });

    return {
      success: true,
      data: {
        ...atualizado,
        active: calcularActive(atualizado.dataLeilao),
      },
    };
  } catch (error: any) {
    console.error('Erro ao atualizar lance limite:', error);

    if (error?.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Veículo não encontrado',
      });
    }

    if (error?.statusCode && error?.statusMessage) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao atualizar lance limite',
    });
  }
});
