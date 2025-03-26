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
        return veiculos
            .map(veiculo => ({
                veiculo,
                score: this.calcularScore(veiculo)
            }))
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Calcula o score de um veículo com base em lucro bruto, percentual de lucro, quilometragem e marca
     * @param veiculo Veículo para calcular o score
     * @returns Score calculado entre 0 e 10 com penalidades aplicadas
     */
    static calcularScore(veiculo: Veiculo): number {
        // Extrair valores do veículo
        const maiorLance = veiculo.lanceAtual || veiculo.lanceInicial;
        const valorMercado = veiculo.valorMercado || 0;
        const quilometragem = veiculo.quilometragem || 0;
        const marca = veiculo.marca?.toLowerCase() || '';

        // Calcular lucro bruto e percentual de lucro
        const lucroBruto = valorMercado - maiorLance;
        const percentualLucro = maiorLance > 0 ? (lucroBruto / maiorLance) * 100 : 0;

        // 1. Score para Lucro Bruto
        let scoreLucroBruto: number;
        if (lucroBruto >= 10000) {
            // Normaliza entre 10000 (0) e 30000 (1)
            scoreLucroBruto = Math.min((lucroBruto - 10000) / (30000 - 10000), 1);
        } else {
            // Normaliza entre 5000 (0) e 10000 (0.5)
            scoreLucroBruto = Math.max((lucroBruto - 5000) / (10000 - 5000), 0) * 0.5;
        }

        // 2. Score para Percentual de Lucro (apenas se lucro bruto >= 10000)
        let scorePercentualLucro = 0;
        if (lucroBruto >= 10000) {
            // Normaliza entre 30% (0) e 50% (1)
            scorePercentualLucro = Math.min((percentualLucro - 30) / (50 - 30), 1);
            scorePercentualLucro = Math.max(scorePercentualLucro, 0);
        }

        // 3. Score para Quilometragem
        let scoreQuilometragem: number;
        if (quilometragem <= 30000) {
            scoreQuilometragem = 1;
        } else if (quilometragem <= 210000) {
            scoreQuilometragem = 1 - (quilometragem - 30000) / 180000;
        } else {
            scoreQuilometragem = 0;
        }

        // 4. Score para Marca
        const classificacaoMarca = {
            excelente: ['toyota', 'honda', 'hyundai'],
            muitoBoas: ['jeep', 'volkswagen', 'vw', 'nissan', 'mitsubishi'],
            boas: ['chevrolet', 'chev', 'fiat', 'renault', 'ford', 'kia'],
            regular: ['citroen', 'peugeot', 'jac'],
            ruim: ['bmw', 'mercedes', 'audi', 'land rover', 'volvo', 'subaru', 'mazda'],
        };

        let scoreMarca: number;
        if (classificacaoMarca.excelente.includes(marca)) {
            scoreMarca = 1;
        } else if (classificacaoMarca.muitoBoas.includes(marca)) {
            scoreMarca = 0.8;
        } else if (classificacaoMarca.boas.includes(marca)) {
            scoreMarca = 0.6;
        } else if (classificacaoMarca.regular.includes(marca)) {
            scoreMarca = 0.4;
        } else if (classificacaoMarca.ruim.includes(marca)) {
            scoreMarca = 0.2;
        } else {
            scoreMarca = 0; // Muito ruim
        }

        // Cálculo do score base com pesos
        const scoreBase =
            (scoreLucroBruto * 0.35) +  // 35% de peso
            (scorePercentualLucro * 0.25) +  // 25% de peso
            (scoreQuilometragem * 0.2) +  // 20% de peso
            (scoreMarca * 0.2);  // 20% de peso

        // Converter para escala de 0 a 10
        let scoreFinal = scoreBase * 10;

        // Aplicar penalidades extras
        if (lucroBruto < 10000) {
            scoreFinal = Math.max(scoreFinal - 2, 0); // Penalidade de -2
        }
        if (quilometragem > 210000) {
            scoreFinal = Math.max(scoreFinal - 1, 0); // Penalidade de -1
        }
        if (quilometragem > 250000) {
            scoreFinal = Math.max(scoreFinal - 1, 0); // Penalidade adicional de -1
        }

        return parseFloat(scoreFinal.toFixed(1)); // Retorna com 1 casa decimal
    }
}