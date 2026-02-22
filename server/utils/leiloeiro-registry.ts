import type { Veiculo } from '~/types/veiculo';
import { LeilaoParser } from './scrapper-parser';
import { LeiloParser } from './leilo-parser';
import { normalizarDominio } from './veiculo-runtime';

export interface LeiloeiroConfig {
  descricao: string;
  dominio: string;
  comissaoPadrao: number;
  taxaAdmPadrao: number;
  taxaDespachantePadrao: number;
  taxaVistoriaPadrao: number;
  parser: (html: string, url: string) => Promise<Veiculo | null>;
}

const LEILOEIROS: LeiloeiroConfig[] = [
  {
    descricao: 'Parque dos Leilões',
    dominio: 'parquedosleiloes.com.br',
    comissaoPadrao: 5,
    taxaAdmPadrao: 1700,
    taxaDespachantePadrao: 0,
    taxaVistoriaPadrao: 0,
    parser: (html, url) => LeilaoParser.parseParqueDoLeiloes(html, url),
  },
  {
    descricao: 'Leilo',
    dominio: 'leilo.com.br',
    comissaoPadrao: 5,
    taxaAdmPadrao: 1700,
    taxaDespachantePadrao: 0,
    taxaVistoriaPadrao: 0,
    parser: (html, url) => LeiloParser.parseLeiloBr(html, url),
  },
];

function dominioCompativel(url: string, dominio: string): boolean {
  const host = normalizarDominio(url);
  return host === dominio || host.endsWith(`.${dominio}`);
}

export function getLeiloeiroPorUrl(url: string): LeiloeiroConfig | null {
  return LEILOEIROS.find((l) => dominioCompativel(url, l.dominio)) || null;
}

export function getLeiloeiroPorDominio(dominio: string): LeiloeiroConfig | null {
  return LEILOEIROS.find((l) => l.dominio === dominio) || null;
}

export function isUrlSuportada(url: string): boolean {
  return LEILOEIROS.some((l) => dominioCompativel(url, l.dominio));
}
