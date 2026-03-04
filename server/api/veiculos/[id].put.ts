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
    const id = getRouterParam(event, 'id');

    if (!id || id === 'undefined' || id === 'null') {
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

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nenhum campo válido para atualização foi informado',
      });
    }

    const veiculoPorId = await prisma.veiculo.findUnique({
      where: { id },
      select: { id: true },
    });

    let idAlvo = veiculoPorId?.id;

    if (!idAlvo && typeof body.urlOrigem === 'string' && body.urlOrigem.trim()) {
      const veiculoPorUrl = await prisma.veiculo.findUnique({
        where: { urlOrigem: body.urlOrigem.trim() },
        select: { id: true },
      });
      idAlvo = veiculoPorUrl?.id;
    }

    if (!idAlvo) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Veículo não encontrado para atualização',
      });
    }

    const veiculoAtualizado = await prisma.veiculo.update({
      where: { id: idAlvo },
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

    if (error?.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Veículo não encontrado para atualização',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Erro ao atualizar veículo',
    });
  }
});
