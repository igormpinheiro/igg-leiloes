import prisma from '../../utils/prisma';
import { calcularActive } from '../../utils/veiculo-runtime';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const marca = query.marca as string;
    const anoMin = query.anoMin ? Number(query.anoMin) : undefined;
    const anoMax = query.anoMax ? Number(query.anoMax) : undefined;
    const precoMin = query.precoMin ? Number(query.precoMin) : undefined;
    const precoMax = query.precoMax ? Number(query.precoMax) : undefined;
    const kmMin = query.kmMin ? Number(query.kmMin) : undefined;
    const kmMax = query.kmMax ? Number(query.kmMax) : undefined;
    const semSinistro = query.semSinistro === 'true';
    const leiloeiroId = query.leiloeiroId ? Number(query.leiloeiroId) : undefined;
    const ordenacao = query.ordenacao as string || 'lanceAtual_asc';

    const filtros: any = {};

    if (marca) {
      filtros.marca = {
        contains: marca,
      };
    }

    if (anoMin || anoMax) {
      filtros.ano = {};

      if (anoMin) {
        filtros.ano.gte = String(anoMin);
      }

      if (anoMax) {
        filtros.ano.lte = String(anoMax + 1);
      }
    }

    if (precoMin || precoMax) {
      filtros.lanceAtual = {};

      if (precoMin) {
        filtros.lanceAtual.gte = precoMin;
      }

      if (precoMax) {
        filtros.lanceAtual.lte = precoMax;
      }
    }

    if (kmMin || kmMax) {
      filtros.quilometragem = {};

      if (kmMin) {
        filtros.quilometragem.gte = kmMin;
      }

      if (kmMax) {
        filtros.quilometragem.lte = kmMax;
      }
    }

    if (semSinistro) {
      filtros.sinistro = 'Nenhum';
    }

    if (leiloeiroId) {
      filtros.leiloeiroId = leiloeiroId;
    }

    const parts = ordenacao.split('_');
    const campo = parts[0] || 'lanceAtual';
    const ordem = parts[1] || 'asc';
    const orderBy: any = {};
    orderBy[campo] = ordem;

    const veiculos = await prisma.veiculo.findMany({
      where: filtros,
      include: {
        leiloeiro: true,
      },
      skip,
      take: limit,
      orderBy,
    });

    const total = await prisma.veiculo.count({
      where: filtros,
    });

    const marcasResult = await prisma.veiculo.findMany({
      distinct: ['marca'],
      select: {
        marca: true,
      },
      orderBy: {
        marca: 'asc',
      },
    });

    const leiloeiros = await prisma.leiloeiro.findMany({
      orderBy: { descricao: 'asc' },
    });

    const marcas = marcasResult.map((item: { marca: string }) => item.marca);

    return {
      success: true,
      data: veiculos.map((veiculo: any) => ({
        ...veiculo,
        active: calcularActive(veiculo.dataLeilao),
      })),
      marcas,
      leiloeiros,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Erro ao buscar veículos:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao buscar veículos',
    });
  }
});
