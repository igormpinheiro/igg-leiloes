import { parse } from 'node-html-parser';
import { getLeiloeiroPorUrl, getLeiloeiroPorDominio, isUrlSuportada } from '../../utils/leiloeiro-registry';
import { upsertVeiculo, deletarVeiculoPorUrl } from '../../utils/veiculo-repository';
import prisma from '../../utils/prisma';
import { normalizarDominio } from '../../utils/veiculo-runtime';

export default defineEventHandler(async (event) => {
  try {
    const { url, dataLeilao } = await readBody(event);

    if (!url) {
      throw createError({ statusCode: 400, statusMessage: 'URL é obrigatória' });
    }

    if (!isUrlSuportada(url)) {
      throw createError({ statusCode: 400, statusMessage: 'URL não suportada. Atualmente só suportamos os sites Parque dos Leilões e Leilo.' });
    }

    console.log(`Fazendo requisição para: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw createError({ statusCode: 500, statusMessage: `Não foi possível acessar a URL. Status: ${response.status}` });
    }

    const html = await response.text();
    console.log(`Recebido HTML com ${html.length} caracteres`);

    const leiloeiroConfig = getLeiloeiroPorUrl(url)!;
    const veiculo = await leiloeiroConfig.parser(html, url);

    let nextUrl: string | null = null;
    const root = parse(html);
    const nextButton = root.querySelector('.btn-next');
    if (nextButton && !nextButton.classList.contains('btn-disabled') && !nextButton.hasAttribute('disabled')) {
      const href = nextButton.getAttribute('href');
      if (href && href !== '#') {
        nextUrl = href.startsWith('http') ? href : `https://www.parquedosleiloes.com.br${href}`;
      }
    }

    if (!veiculo) {
      console.log('Leilão cancelado, inválido ou veículo descartado. Verificando banco para deleção...');
      const deleted = await deletarVeiculoPorUrl(url);
      if (deleted) console.log('Veículo removido do banco (lote cancelado/sucata)');

      return {
        success: false,
        message: 'Leilão cancelado, inválido ou veículo descartado (sucata/grande monta).',
        action: 'deleted' as const,
        nextUrl,
      };
    }

    const dominio = normalizarDominio(url);
    const defaults = getLeiloeiroPorDominio(dominio);

    if (!defaults) {
      throw createError({
        statusCode: 422,
        statusMessage: `Leiloeiro não mapeado para o domínio: ${dominio}`,
      });
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

    const dataLeilaoDate = dataLeilao ? new Date(dataLeilao) : new Date();
    veiculo.dataLeilao = dataLeilaoDate;
    veiculo.leiloeiroId = leiloeiro.id;

    const { action } = await upsertVeiculo(veiculo, dataLeilaoDate);
    console.log(`Veículo ${action}: ${veiculo.modelo}`);

    return {
      success: true,
      data: {
        ...veiculo,
        leiloeiro,
      },
      action,
      nextUrl,
    };
  } catch (error: any) {
    console.error('Erro ao extrair dados:', error);
    if (error?.statusCode && error?.statusMessage) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ocorreu um erro ao extrair os dados da página',
    });
  }
});
