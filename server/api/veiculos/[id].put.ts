// server/api/veiculos/[id].put.ts
import prisma from '../../utils/prisma';

const CAMPOS_PERMITIDOS = [
  'descricao', 'marca', 'ano', 'quilometragem', 'sinistro',
  'lanceInicial', 'lanceAtual', 'valorMercado', 'active',
] as const;

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do veículo não fornecido',
      });
    }

    const body = await readBody(event);

    // Whitelist: apenas campos permitidos passam para o Prisma
    const updateData: Record<string, any> = {};
    for (const campo of CAMPOS_PERMITIDOS) {
      if (body[campo] !== undefined) {
        updateData[campo] = body[campo];
      }
    }

    const veiculoAtualizado = await prisma.veiculo.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Veículo atualizado com sucesso',
      data: veiculoAtualizado,
    };
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Erro ao atualizar veículo',
    });
  }
});
