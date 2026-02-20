// server/utils/leiloeiro-registry.ts
import type { Veiculo } from '~/types/veiculo';
import { LeilaoParser } from './scrapper-parser';
import { LeiloParser } from './leilo-parser';

interface LeiloeiroConfig {
  nome: string;
  dominio: string;
  parser: (html: string, url: string) => Promise<Veiculo | null>;
}

const LEILOEIROS: LeiloeiroConfig[] = [
  {
    nome: 'Parque dos Leilões',
    dominio: 'parquedosleiloes.com.br',
    parser: (html, url) => LeilaoParser.parseParqueDoLeiloes(html, url),
  },
  {
    nome: 'Leilo',
    dominio: 'leilo.com.br',
    parser: (html, url) => LeiloParser.parseLeiloBr(html, url),
  },
];

export function getLeiloeiroPorUrl(url: string): LeiloeiroConfig | null {
  return LEILOEIROS.find(l => url.includes(l.dominio)) || null;
}

export function isUrlSuportada(url: string): boolean {
  return LEILOEIROS.some(l => url.includes(l.dominio));
}

export function getNomeLeiloeiro(url: string): string {
  return getLeiloeiroPorUrl(url)?.nome || 'Desconhecido';
}
