// server/api/veiculos.post.ts
import type { Veiculo } from '~/types/veiculo';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        const veiculo = await readBody(event);

        if (!veiculo || !veiculo.descricao || !veiculo.marca) {
            return createError({
                statusCode: 400,
                statusMessage: 'Dados do veículo incompletos'
            });
        }

        // Salvar no banco de dados usando Prisma
        const novoVeiculo = await prisma.veiculo.create({
            data: {
                descricao: veiculo.descricao,
                marca: veiculo.marca,
                ano: veiculo.ano,
                quilometragem: veiculo.quilometragem,
                sinistro: veiculo.sinistro,
                lanceInicial: veiculo.lanceInicial,
                lanceAtual: veiculo.lanceAtual,
                valorMercado: veiculo.valorMercado,
                dataCaptura: new Date(veiculo.dataCaptura),
                urlOrigem: veiculo.urlOrigem
            }
        });

        return {
            success: true,
            message: 'Veículo salvo com sucesso',
            id: novoVeiculo.id
        };

    } catch (error: any) {
        console.error('Erro ao salvar veículo:', error);

        return createError({
            statusCode: 500,
            statusMessage: error.message || 'Ocorreu um erro ao salvar o veículo'
        });
    }
});