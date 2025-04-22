// types/veiculo.ts
export interface Veiculo {
    id: string;
    descricao: string;
    marca: string;
    ano: string;
    quilometragem: number;
    sinistro: boolean;
    lanceInicial: number;
    lanceAtual: number;
    valorMercado: number;
    dataCaptura: Date;
    urlOrigem: string;
    active: boolean;
    leiloeiro?: string;
}