// server/api/veiculos/index.get.ts
import prisma from '../../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        // Obter parâmetros de query para filtros e paginação
        const query = getQuery(event);

        // Parâmetros de paginação
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;

        // Parâmetros de filtro
        const marca = query.marca as string;
        const anoMin = query.anoMin ? Number(query.anoMin) : undefined;
        const anoMax = query.anoMax ? Number(query.anoMax) : undefined;
        const precoMin = query.precoMin ? Number(query.precoMin) : undefined;
        const precoMax = query.precoMax ? Number(query.precoMax) : undefined;
        const kmMin = query.kmMin ? Number(query.kmMin) : undefined;
        const kmMax = query.kmMax ? Number(query.kmMax) : undefined;
        const semSinistro = query.semSinistro === 'true';
        const ordenacao = query.ordenacao as string || 'lanceAtual_asc';

        // Construir filtros dinâmicos para o Prisma
        const filtros: any = {};

        if (marca) {
            filtros.marca = {
                contains: marca,
                mode: 'insensitive'
            };
        }

        if (anoMin || anoMax) {
            filtros.ano = {};

            if (anoMin) {
                // Filtrar anos como strings, considerando apenas o ano inicial (antes da barra)
                filtros.ano.gte = String(anoMin);
            }

            if (anoMax) {
                // Menor que o próximo ano (para incluir o ano máximo)
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
            filtros.sinistro = false;
        }

        // Definir ordenação
        const [campo, ordem] = ordenacao.split('_');
        const orderBy: any = {};
        orderBy[campo] = ordem;

        // Buscar veículos com filtros
        const veiculos = await prisma.veiculo.findMany({
            where: filtros,
            skip,
            take: limit,
            orderBy
        });

        // Contar total de veículos para paginação
        const total = await prisma.veiculo.count({
            where: filtros
        });

        // Obter marcas distintas para o filtro
        const marcasResult = await prisma.veiculo.findMany({
            distinct: ['marca'],
            select: {
                marca: true
            },
            orderBy: {
                marca: 'asc'
            }
        });

        const marcas = marcasResult.map(item => item.marca);

        return {
            success: true,
            data: veiculos,
            marcas,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };

    } catch (error: any) {
        console.error('Erro ao buscar veículos:', error);

        return createError({
            statusCode: 500,
            statusMessage: error.message || 'Erro ao buscar veículos'
        });
    }
});