// server/api/veiculos/[id].get.ts
import prisma from '../../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return createError({
                statusCode: 400,
                statusMessage: 'ID do veículo é obrigatório'
            });
        }

        const veiculo = await prisma.veiculo.findUnique({
            where: {
                id
            }
        });

        if (!veiculo) {
            return createError({
                statusCode: 404,
                statusMessage: 'Veículo não encontrado'
            });
        }

        return {
            success: true,
            data: veiculo
        };

    } catch (error: any) {
        console.error('Erro ao buscar veículo:', error);

        return createError({
            statusCode: 500,
            statusMessage: error.message || 'Erro ao buscar veículo'
        });
    }
});