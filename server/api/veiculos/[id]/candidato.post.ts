import prisma from '../../../utils/prisma';
import { calcularActive } from '../../../utils/veiculo-runtime';
import { calcularLanceLimite } from '../../../utils/lance-limite';

const INCREMENTO_PADRAO = 400;

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

    if (typeof body?.isCandidato !== 'boolean') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Campo isCandidato é obrigatório e deve ser boolean.',
      });
    }

    const veiculoExistente = await prisma.veiculo.findUnique({
      where: { id },
      include: { leiloeiro: true },
    });

    if (!veiculoExistente) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Veículo não encontrado',
      });
    }

    if (body.isCandidato) {
      const atualizado = await prisma.$transaction(async (tx) => {
        const atual = await tx.veiculo.findUnique({ where: { id } });

        if (!atual) {
          throw createError({ statusCode: 404, statusMessage: 'Veículo não encontrado' });
        }

        const maxOrdem = await tx.veiculo.aggregate({
          where: { isCandidato: true },
          _max: { candidatoOrdem: true },
        });

        const proximaOrdem = (maxOrdem._max.candidatoOrdem ?? 0) + 1;

        return tx.veiculo.update({
          where: { id },
          data: {
            isCandidato: true,
            candidatoOrdem: atual.candidatoOrdem ?? proximaOrdem,
            lanceLimite: atual.lanceLimite ?? calcularLanceLimite({
              valorMercado: atual.valorMercado,
              lanceAtual: atual.lanceAtual,
              lanceInicial: atual.lanceInicial,
              incremento: INCREMENTO_PADRAO,
            }),
            candidatoStatus: 'ok',
            candidatoUltimoErro: null,
            candidatoAtualizadoEm: new Date(),
          },
          include: { leiloeiro: true },
        });
      });

      return {
        success: true,
        data: {
          ...atualizado,
          active: calcularActive(atualizado.dataLeilao),
        },
      };
    }

    if (!body.confirmar) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Confirmação obrigatória para remover candidato.',
      });
    }

    const atualizado = await prisma.veiculo.update({
      where: { id },
      data: {
        isCandidato: false,
        candidatoOrdem: null,
        candidatoStatus: null,
        candidatoUltimoErro: null,
      },
      include: { leiloeiro: true },
    });

    return {
      success: true,
      data: {
        ...atualizado,
        active: calcularActive(atualizado.dataLeilao),
      },
    };
  } catch (error: any) {
    console.error('Erro ao alternar candidato:', error);

    if (error?.statusCode && error?.statusMessage) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao alternar candidato',
    });
  }
});
