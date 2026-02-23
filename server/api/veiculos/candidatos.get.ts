import prisma from '../../utils/prisma';
import { calcularActive } from '../../utils/veiculo-runtime';

export default defineEventHandler(async () => {
  try {
    const candidatos = await prisma.veiculo.findMany({
      where: { isCandidato: true },
      include: { leiloeiro: true },
      orderBy: [
        { candidatoOrdem: 'asc' },
        { updatedAt: 'desc' },
      ],
    });

    const comStatus = candidatos.map((veiculo: any) => ({
      ...veiculo,
      active: calcularActive(veiculo.dataLeilao),
    }));

    const ativos = comStatus.filter((item) => item.active);
    const inativos = comStatus.filter((item) => !item.active);

    return {
      success: true,
      ativos,
      inativos,
      total: comStatus.length,
    };
  } catch (error: any) {
    console.error('Erro ao listar candidatos:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao listar candidatos',
    });
  }
});
