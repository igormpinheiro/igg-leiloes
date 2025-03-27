// server/api/veiculos/[id].put.ts
import { defineEventHandler, readBody } from 'h3';
import type { Veiculo } from '~/types/veiculo';

export default defineEventHandler(async (event) => {
    try {
        // Extrair ID do veículo da URL
        const id = event.context.params?.id;

        if (!id) {
            return {
                success: false,
                message: 'ID do veículo não fornecido',
            };
        }

        // Obter os dados atualizados do corpo da requisição
        const veiculoAtualizado = await readBody(event);

        const veiculoAtualizado2 = await prisma.veiculo.update({
          where: { id },
          data: veiculoAtualizado,
        });

        return {
            success: true,
            message: 'Veículo atualizado com sucesso',
            data: veiculoAtualizado2,
        };
    } catch (error) {
        console.error('Erro ao atualizar veículo:', error);

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Erro ao atualizar veículo',
        };
    }
});