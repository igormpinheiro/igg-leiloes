// server/api/veiculos.get.ts
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        // Pegar parâmetros de query para paginação
        const query = getQuery(event);
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        // Buscar veículos com paginação
        const veiculos = await prisma.veiculo.findMany({
            // take: limit,
            // skip: skip,
            orderBy: {
                descricao: 'desc'
            }
        });

        // Obter contagem total para paginação
        const total = await prisma.veiculo.count();

        return {
            success: true,
            data: veiculos,
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
            statusMessage: error.message || 'Ocorreu um erro ao buscar os veículos'
        });
    }
});