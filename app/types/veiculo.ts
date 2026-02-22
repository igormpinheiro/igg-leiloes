// types/veiculo.ts

export enum TipoSinistro {
  Nenhum = 'Nenhum',
  IndicioSinistro = 'IndicioSinistro',
  RecuperadoSinistro = 'RecuperadoSinistro',
  PequenaMonta = 'PequenaMonta',
  MediaMonta = 'MediaMonta',
  GrandeMonta = 'GrandeMonta',
  Sucata = 'Sucata',
}

export interface Leiloeiro {
  id: number;
  descricao: string;
  dominio: string;
  comissao: number;
  taxaAdm: number;
  taxaDespachante: number;
  taxaVistoria: number;
}

export interface Veiculo {
  id: string;
  modelo: string;
  descricao: string;
  marca: string;
  ano: string;
  quilometragem: number;
  sinistro: TipoSinistro;
  ipvaPago: boolean;
  numeroLote?: number | null;
  lanceInicial: number;
  lanceAtual: number;
  valorMercado: number;
  dataCaptura: Date;
  dataLeilao?: Date;
  urlOrigem: string;
  active: boolean;
  leiloeiroId: number;
  leiloeiro?: Leiloeiro;
  patioUf?: string;
}
