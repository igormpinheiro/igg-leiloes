// server/api/veiculos.post.ts
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);

        // Se o parser retornou null, deletar o veículo do banco se existir
        if (body.parserReturnedNull && body.urlOrigem) {
            const existing = await prisma.veiculo.findUnique({
                where: { urlOrigem: body.urlOrigem }
            });

            if (existing) {
                await prisma.veiculo.delete({
                    where: { urlOrigem: body.urlOrigem }
                });
                return { success: true, action: 'deleted' as const };
            }

            return { success: true, action: 'deleted' as const };
        }

        const veiculo = body;

        if (!veiculo || !veiculo.descricao || !veiculo.marca) {
            return createError({
                statusCode: 400,
                statusMessage: 'Dados do veículo incompletos'
            });
        }

        const dataLeilao = veiculo.dataLeilao ? new Date(veiculo.dataLeilao) : new Date();
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const isActive = dataLeilao >= hoje;

        const result = await prisma.veiculo.upsert({
            where: { urlOrigem: veiculo.urlOrigem },
            create: {
                descricao: veiculo.descricao,
                marca: veiculo.marca,
                ano: veiculo.ano,
                quilometragem: veiculo.quilometragem,
                sinistro: veiculo.sinistro,
                lanceInicial: veiculo.lanceInicial,
                lanceAtual: veiculo.lanceAtual,
                valorMercado: veiculo.valorMercado,
                dataCaptura: new Date(veiculo.dataCaptura),
                dataLeilao: dataLeilao,
                urlOrigem: veiculo.urlOrigem,
                active: isActive,
                leiloeiro: veiculo.leiloeiro
            },
            update: {
                lanceAtual: veiculo.lanceAtual,
                active: isActive
            }
        });

        // Determinar se foi criado ou atualizado
        const wasCreated = result.createdAt.getTime() === result.updatedAt.getTime()
            || (Date.now() - result.createdAt.getTime()) < 1000;

        return {
            success: true,
            action: wasCreated ? 'created' as const : 'updated' as const,
            id: result.id
        };

    } catch (error: any) {
        console.error('Erro ao salvar veículo:', error);

        return createError({
            statusCode: 500,
            statusMessage: error.message || 'Ocorreu um erro ao salvar o veículo'
        });
    }
});
