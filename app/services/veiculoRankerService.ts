// services/veiculoRankerService.ts
import type { Veiculo } from '~/types/veiculo';

/**
 * Serviço responsável por calcular e rankear os veículos com base em diversos fatores
 */
export class VeiculoRanker {
    /**
     * Rankeia uma lista de veículos em ordem decrescente de score
     * @param veiculos Lista de veículos para rankear
     * @returns Lista de tuplas (veículo, score) ordenada pelo score
     */
    static rankearVeiculos(veiculos: Veiculo[]): Array<{ veiculo: Veiculo, score: number }> {
        // Calcular valores mínimos e máximos para normalização
        const minLucroBruto = Math.min(...veiculos.map(v => v.valorMercado - (v.lanceAtual || 0)));
        const maxLucroBruto = Math.max(...veiculos.map(v => v.valorMercado - (v.lanceAtual || 0)));
        const minValorizacao = Math.min(...veiculos.map(v => (v.lanceAtual || 0) > 0 ? ((v.valorMercado - (v.lanceAtual || 0)) / (v.lanceAtual || 0)) * 100 : 0));
        const maxValorizacao = Math.max(...veiculos.map(v => (v.lanceAtual || 0) > 0 ? ((v.valorMercado - (v.lanceAtual || 0)) / (v.lanceAtual || 0)) * 100 : 0));
        const minKm = Math.min(...veiculos.map(v => v.quilometragem || 0));
        const maxKm = Math.max(...veiculos.map(v => v.quilometragem || 0));
        const minAno = Math.min(...veiculos.map(v => {
            const anoMatch = v.ano?.match(/\d{4}/);
            return anoMatch ? parseInt(anoMatch[0]) : new Date().getFullYear();
        }));
        const maxAno = Math.max(...veiculos.map(v => {
            const anoMatch = v.ano?.match(/\d{4}/);
            return anoMatch ? parseInt(anoMatch[0]) : new Date().getFullYear();
        }));

        return veiculos
            .map(veiculo => ({
                veiculo,
                score: this.calcularScore(veiculo, minLucroBruto, maxLucroBruto, minValorizacao, maxValorizacao, minKm, maxKm, minAno, maxAno)
            }))
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Calcula o score de um veículo com base em diversos fatores
     * @param veiculo Veículo para calcular o score
     * @param minLucroBruto Menor lucro bruto na lista
     * @param maxLucroBruto Maior lucro bruto na lista
     * @param minValorizacao Menor % de valorização na lista
     * @param maxValorizacao Maior % de valorização na lista
     * @param minKm Menor quilometragem na lista
     * @param maxKm Maior quilometragem na lista
     * @param minAno Menor ano na lista
     * @param maxAno Maior ano na lista
     * @returns Score calculado entre 0 e 10
     */
    static calcularScore(
        veiculo: Veiculo,
        minLucroBruto: number,
        maxLucroBruto: number,
        minValorizacao: number,
        maxValorizacao: number,
        minKm: number,
        maxKm: number,
        minAno: number,
        maxAno: number
    ): number {
        // Extrair valores do veículo
        const maiorLance = veiculo.lanceAtual || 0;
        const valorMercado = veiculo.valorMercado || 0;
        const quilometragem = veiculo.quilometragem || 0;

        // 1. Lucro Bruto (normalizado entre 0 e 1)
        const lucroBruto = valorMercado - maiorLance;
        const lucroBrutoNormalizado = maxLucroBruto === minLucroBruto ? 1 : (lucroBruto - minLucroBruto) / (maxLucroBruto - minLucroBruto);

        // 2. % Valorização (normalizado entre 0 e 1)
        const percentualValorizacao = maiorLance > 0 ? ((valorMercado - maiorLance) / maiorLance) * 100 : 0;
        const valorizacaoNormalizada = maxValorizacao === minValorizacao ? 1 : (percentualValorizacao - minValorizacao) / (maxValorizacao - minValorizacao);

        // 3. Quilometragem (normalizado entre 0 e 1, invertido: menor km = maior nota)
        const kmNormalizada = maxKm === minKm ? 1 : 1 - ((quilometragem - minKm) / (maxKm - minKm));

        // 4. Sinistro (0 se tiver sinistro, 1 se não tiver)
        const penalizacaoSinistro = veiculo.sinistro ? 0 : 1;

        // 5. Ano (normalizado entre 0 e 1)
        let anoVeiculo = new Date().getFullYear();
        if (veiculo.ano) {
            const anoMatch = veiculo.ano.match(/\d{4}/);
            if (anoMatch) anoVeiculo = parseInt(anoMatch[0]);
        }
        const anoNormalizado = maxAno === minAno ? 1 : (anoVeiculo - minAno) / (maxAno - minAno);

        // 6. Marca (escala fixa entre 0 e 1)
        const marca = veiculo.marca?.toLowerCase() || '';
        let classificacaoMarca = 0;
        if (['honda', 'toyota'].includes(marca)) {
            classificacaoMarca = 1; // Excelente
        } else if (['nissan', 'mitsubishi'].includes(marca)) {
            classificacaoMarca = 0.75; // Muito Bom
        } else if (['chevrolet', 'chev', 'vw', 'volkswagen', 'fiat', 'renault', 'peugeot', 'hyundai', 'kia', 'jeep'].includes(marca)) {
            classificacaoMarca = 0.5; // Bom
        } else if (['bmw', 'land rover', 'mercedes'].includes(marca)) {
            classificacaoMarca = 0.25; // Regular
        }

        // Cálculo final com pesos
        const score =
            (lucroBrutoNormalizado * 0.4) +    // 40%
            (valorizacaoNormalizada * 0.2) +    // 20%
            (kmNormalizada * 0.1) +             // 10%
            (penalizacaoSinistro * 0.1) +       // 10%
            (anoNormalizado * 0.1) +            // 10%
            (classificacaoMarca * 0.1);         // 10%

        // Escala de 0 a 10
        return parseFloat((score * 10).toFixed(1));
    }
}