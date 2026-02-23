import prisma from '../../../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const ids = body?.ids;

    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== 'string' || !id.trim())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Envie ids como array de strings não vazio.',
      });
    }

    const idsSemDuplicidade = new Set(ids);
    if (idsSemDuplicidade.size !== ids.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A lista de ids possui valores duplicados.',
      });
    }

    const candidatos = await prisma.veiculo.findMany({
      where: { isCandidato: true },
      select: { id: true },
    });

    if (candidatos.length !== ids.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A lista deve conter todos os candidatos no banco.',
      });
    }

    const idsBanco = new Set(candidatos.map((item) => item.id));
    const todosValidos = ids.every((id) => idsBanco.has(id));

    if (!todosValidos) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A lista contém IDs inválidos ou não candidatos.',
      });
    }

    await prisma.$transaction(ids.map((id, index) => prisma.veiculo.update({
      where: { id },
      data: {
        candidatoOrdem: index + 1,
        candidatoAtualizadoEm: new Date(),
      },
    })));

    return {
      success: true,
      message: 'Ordem atualizada com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao reordenar candidatos:', error);

    if (error?.statusCode && error?.statusMessage) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao reordenar candidatos',
    });
  }
});
