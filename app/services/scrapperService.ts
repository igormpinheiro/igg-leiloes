import type { Veiculo } from '~/types/veiculo';

export interface ExtractResult {
  veiculo: Veiculo | null;
  action: 'created' | 'updated' | 'deleted';
  nextUrl: string | null;
}

function calcularActive(dataLeilao?: Date): boolean {
  if (!dataLeilao) return false;

  const formatarDia = (data: Date) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data);

  return formatarDia(dataLeilao) >= formatarDia(new Date());
}

export const scrapperService = {
  /**
   * Executa o scrapper em uma URL específica (com auto-save no servidor)
   */
  async executarScrapper(url: string, dataLeilao?: string): Promise<ExtractResult> {
    if (!this.isUrlSupported(url)) {
      throw new Error('URL não suportada. Atualmente suportamos apenas os sites Parque dos Leilões e Leilo.');
    }

    const body: Record<string, string> = { url };
    if (dataLeilao) {
      body.dataLeilao = dataLeilao;
    }

    const response = await fetch('/api/scrapper/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || 'Falha ao extrair dados do site.');
    }

    const data = await response.json();

    if (!data.success) {
      return {
        veiculo: null,
        action: data.action || 'deleted',
        nextUrl: data.nextUrl || null,
      };
    }

    const veiculo = data.data as Veiculo;
    veiculo.dataCaptura = new Date(veiculo.dataCaptura);
    if (veiculo.dataLeilao) {
      veiculo.dataLeilao = new Date(veiculo.dataLeilao);
    }
    veiculo.active = calcularActive(veiculo.dataLeilao);

    return {
      veiculo,
      action: data.action || 'created',
      nextUrl: data.nextUrl || null,
    };
  },

  async extrairListagem(url: string, fullExtraction: boolean = true): Promise<{
    success: boolean;
    total: number;
    loteUrls: string[];
    dataLeilao?: string;
    method?: string;
    warning?: string;
  }> {
    const response = await fetch('/api/scrapper/extract-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, fullExtraction }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || 'Falha ao extrair listagem');
    }

    return await response.json();
  },

  isUrlSupported(url: string): boolean {
    const supportedDomains = [
      'parquedosleiloes.com.br',
      'leilo.com.br',
    ];

    return supportedDomains.some((domain) => url.includes(domain));
  },
};
