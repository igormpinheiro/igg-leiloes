import { parse } from 'node-html-parser';
import { getLeiloeiroPorUrl, getLeiloeiroPorDominio, isUrlSuportada } from './leiloeiro-registry';
import { upsertVeiculo, deletarVeiculoPorUrl } from './veiculo-repository';
import prisma from './prisma';
import { normalizarDataLeilao, normalizarDominio } from './veiculo-runtime';

type ExtrairVeiculoInput = {
  url: string;
  dataLeilao?: string | Date;
  deletarSeInvalido?: boolean;
};

type ExtrairVeiculoResult = {
  success: boolean;
  action: 'created' | 'updated' | 'deleted' | 'invalid';
  data?: any;
  nextUrl: string | null;
  reason?: string;
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

export async function extrairESalvarVeiculoPorUrl({
  url,
  dataLeilao,
  deletarSeInvalido = true,
}: ExtrairVeiculoInput): Promise<ExtrairVeiculoResult> {
  if (!isUrlSuportada(url)) {
    return {
      success: false,
      action: 'invalid',
      nextUrl: null,
      reason: 'URL não suportada.',
    };
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    return {
      success: false,
      action: 'invalid',
      nextUrl: null,
      reason: `Não foi possível acessar a URL. Status: ${response.status}`,
    };
  }

  const html = await response.text();
  const root = parse(html);

  let nextUrl: string | null = null;
  const nextButton = root.querySelector('.btn-next');
  if (nextButton && !nextButton.classList.contains('btn-disabled') && !nextButton.hasAttribute('disabled')) {
    const href = nextButton.getAttribute('href');
    if (href && href !== '#') {
      nextUrl = href.startsWith('http') ? href : `https://www.parquedosleiloes.com.br${href}`;
    }
  }

  const leiloeiroConfig = getLeiloeiroPorUrl(url);
  if (!leiloeiroConfig) {
    return {
      success: false,
      action: 'invalid',
      nextUrl,
      reason: 'Leiloeiro não identificado para a URL.',
    };
  }

  const veiculo = await leiloeiroConfig.parser(html, url);

  if (!veiculo) {
    if (deletarSeInvalido) {
      await deletarVeiculoPorUrl(url);
      return {
        success: false,
        action: 'deleted',
        nextUrl,
        reason: 'Leilão cancelado, inválido ou veículo descartado.',
      };
    }

    return {
      success: false,
      action: 'invalid',
      nextUrl,
      reason: 'Leilão cancelado, inválido ou veículo descartado.',
    };
  }

  const dominio = normalizarDominio(url);
  const defaults = getLeiloeiroPorDominio(dominio);

  if (!defaults) {
    return {
      success: false,
      action: 'invalid',
      nextUrl,
      reason: `Leiloeiro não mapeado para o domínio: ${dominio}`,
    };
  }

  const leiloeiro = await prisma.leiloeiro.upsert({
    where: { dominio },
    update: {
      descricao: defaults.descricao,
    },
    create: {
      descricao: defaults.descricao,
      dominio: defaults.dominio,
      comissao: defaults.comissaoPadrao,
      taxaAdm: defaults.taxaAdmPadrao,
      taxaDespachante: defaults.taxaDespachantePadrao,
      taxaVistoria: defaults.taxaVistoriaPadrao,
    },
  });

  const dataLeilaoDate = normalizarDataLeilao(dataLeilao);
  veiculo.dataLeilao = dataLeilaoDate;
  veiculo.leiloeiroId = leiloeiro.id;

  const { action } = await upsertVeiculo(veiculo, dataLeilaoDate);

  return {
    success: true,
    action,
    nextUrl,
    data: {
      ...veiculo,
      leiloeiro,
    },
  };
}
