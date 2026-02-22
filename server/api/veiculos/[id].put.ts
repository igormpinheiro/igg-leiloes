import prisma from '../../utils/prisma';

const CAMPOS_PERMITIDOS = [
  'modelo',
  'descricao',
  'marca',
  'ano',
  'quilometragem',
  'sinistro',
  'ipvaPago',
  'numeroLote',
  'lanceInicial',
  'lanceAtual',
  'valorMercado',
] as const;

const SINISTROS_VALIDOS = new Set([
  'Nenhum',
  'IndicioSinistro',
  'RecuperadoSinistro',
  'PequenaMonta',
  'MediaMonta',
  'GrandeMonta',
  'Sucata',
]);

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

    const updateData: Record<string, any> = {};
    for (const campo of CAMPOS_PERMITIDOS) {
      if (body[campo] !== undefined) {
        updateData[campo] = body[campo];
      }
    }

    if (updateData.sinistro && !SINISTROS_VALIDOS.has(updateData.sinistro)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valor de sinistro inválido',
      });
    }

    const veiculoAtualizado = await prisma.veiculo.update({
      where: { id },
      data: updateData,
      include: {
        leiloeiro: true,
      },
    });

    return {
      success: true,
      message: 'Veículo atualizado com sucesso',
      data: veiculoAtualizado,
    };
  } catch (error: any) {
    console.error('Erro ao atualizar veículo:', error);

    if (error?.statusCode && error?.statusMessage) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Erro ao atualizar veículo',
    });
  }
});
