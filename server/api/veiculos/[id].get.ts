import prisma from '../../utils/prisma';
import { calcularActive } from '../../utils/veiculo-runtime';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do veículo é obrigatório',
      });
    }

    const veiculo = await prisma.veiculo.findUnique({
      where: {
        id,
      },
      include: {
        leiloeiro: true,
      },
    });

    if (!veiculo) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Veículo não encontrado',
      });
    }

    return {
      success: true,
      data: {
        ...veiculo,
        active: calcularActive(veiculo.dataLeilao),
      },
    };
  } catch (error: any) {
    console.error('Erro ao buscar veículo:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao buscar veículo',
    });
  }
});
