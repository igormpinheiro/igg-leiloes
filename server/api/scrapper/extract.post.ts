// server/api/scrapper/extract.post.ts
import type { Veiculo } from '~/types/veiculo';
import { LeilaoParser } from '../../utils/scrapper-parser';
import { LeiloParser } from '../../utils/leilo-parser';
import { VeiculoRanker } from '~/services/veiculoRankerService';
import { parse } from 'node-html-parser';
import prisma from '../../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        const { url, dataLeilao } = await readBody(event);

        if (!url) {
            return createError({
                statusCode: 400,
                statusMessage: 'URL é obrigatória'
            });
        }

        // Verificar se a URL é de um site suportado
        if (!url.includes('parquedosleiloes.com.br') && !url.includes('leilo.com.br')) {
            return createError({
                statusCode: 400,
                statusMessage: 'URL não suportada. Atualmente só suportamos os sites Parque dos Leilões e Leilo.'
            });
        }

        // Fazer a requisição para a URL e obter o HTML
        console.log(`Fazendo requisição para: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Erro ao buscar URL: ${response.status} ${response.statusText}`);
            return createError({
                statusCode: 500,
                statusMessage: `Não foi possível acessar a URL. Status: ${response.status}`
            });
        }

        const html = await response.text();
        console.log(`Recebido HTML com ${html.length} caracteres`);

        // Determinar qual parser utilizar com base na URL
        let veiculo: Veiculo | null = null;

        if (url.includes('parquedosleiloes.com.br')) {
            veiculo = await LeilaoParser.parseParqueDoLeiloes(html, url);
        } else if (url.includes('leilo.com.br')) {
            veiculo = await LeiloParser.parseLeiloBr(html, url);
        }

        // Detectar botão próximo no HTML
        let nextUrl: string | null = null;
        const root = parse(html);
        const nextButton = root.querySelector('.btn-next');

        if (nextButton && !nextButton.classList.contains('btn-disabled') && !nextButton.hasAttribute('disabled')) {
            const href = nextButton.getAttribute('href');
            if (href && href !== '#') {
                nextUrl = href.startsWith('http') ? href : `https://www.parquedosleiloes.com.br${href}`;
            }
        }

        // Se parser retornou null (lote cancelado/sucata), deletar do banco se existir
        if (!veiculo) {
            console.log('Leilão cancelado, inválido ou veículo descartado. Verificando banco para deleção...');

            const existing = await prisma.veiculo.findUnique({
                where: { urlOrigem: url }
            });

            if (existing) {
                await prisma.veiculo.delete({
                    where: { urlOrigem: url }
                });
                console.log('Veículo removido do banco (lote cancelado/sucata)');
            }

            return {
                success: false,
                message: 'Leilão cancelado, inválido ou veículo descartado (sucata/grande monta).',
                action: 'deleted' as const,
                nextUrl
            };
        }

        // Auto-save: upsert no banco
        const dataLeilaoDate = dataLeilao ? new Date(dataLeilao) : new Date();
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const isActive = dataLeilaoDate >= hoje;

        // Garantir leiloeiro
        if (!veiculo.leiloeiro) {
            if (url.includes('parquedosleiloes.com.br')) {
                veiculo.leiloeiro = 'Parque dos Leilões';
            } else if (url.includes('leilo.com.br')) {
                veiculo.leiloeiro = 'Leilo';
            }
        }

        veiculo.dataLeilao = dataLeilaoDate;

        const result = await prisma.veiculo.upsert({
            where: { urlOrigem: veiculo.urlOrigem },
            create: {
                descricao: veiculo.descricao,
                marca: veiculo.marca,
                ano: veiculo.ano,
                quilometragem: veiculo.quilometragem,
                sinistro: veiculo.sinistro,
                lanceInicial: veiculo.lanceInicial,
                lanceAtual: veiculo.lanceAtual,
                valorMercado: veiculo.valorMercado,
                dataCaptura: new Date(veiculo.dataCaptura),
                dataLeilao: dataLeilaoDate,
                urlOrigem: veiculo.urlOrigem,
                active: isActive,
                leiloeiro: veiculo.leiloeiro || 'Desconhecido'
            },
            update: {
                lanceAtual: veiculo.lanceAtual,
                active: isActive
            }
        });

        const wasCreated = result.createdAt.getTime() === result.updatedAt.getTime()
            || (Date.now() - result.createdAt.getTime()) < 1000;
        const action = wasCreated ? 'created' : 'updated';

        console.log(`Veículo ${action}: ${veiculo.descricao}`);

        return {
            success: true,
            data: veiculo,
            action,
            nextUrl
        };

    } catch (error: any) {
        console.error('Erro ao extrair dados:', error);

        return createError({
            statusCode: 500,
            statusMessage: error.message || 'Ocorreu um erro ao extrair os dados da página'
        });
    }
});
