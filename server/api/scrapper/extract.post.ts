// server/api/scrapper/extract.post.ts
import { parse } from 'node-html-parser';
import { getLeiloeiroPorUrl, isUrlSuportada, getNomeLeiloeiro } from '../../utils/leiloeiro-registry';
import { upsertVeiculo, deletarVeiculoPorUrl } from '../../utils/veiculo-repository';

export default defineEventHandler(async (event) => {
    try {
        const { url, dataLeilao } = await readBody(event);

        if (!url) {
            throw createError({ statusCode: 400, statusMessage: 'URL é obrigatória' });
        }

        if (!isUrlSuportada(url)) {
            throw createError({ statusCode: 400, statusMessage: 'URL não suportada. Atualmente só suportamos os sites Parque dos Leilões e Leilo.' });
        }

        // Buscar HTML
        console.log(`Fazendo requisição para: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw createError({ statusCode: 500, statusMessage: `Não foi possível acessar a URL. Status: ${response.status}` });
        }

        const html = await response.text();
        console.log(`Recebido HTML com ${html.length} caracteres`);

        // Rotear para o parser correto
        const leiloeiro = getLeiloeiroPorUrl(url)!;
        const veiculo = await leiloeiro.parser(html, url);

        // Detectar botão próximo (Parque dos Leilões)
        let nextUrl: string | null = null;
        const root = parse(html);
        const nextButton = root.querySelector('.btn-next');
        if (nextButton && !nextButton.classList.contains('btn-disabled') && !nextButton.hasAttribute('disabled')) {
            const href = nextButton.getAttribute('href');
            if (href && href !== '#') {
                nextUrl = href.startsWith('http') ? href : `https://www.parquedosleiloes.com.br${href}`;
            }
        }

        // Lote cancelado/sucata: deletar do banco se existir
        if (!veiculo) {
            console.log('Leilão cancelado, inválido ou veículo descartado. Verificando banco para deleção...');
            const deleted = await deletarVeiculoPorUrl(url);
            if (deleted) console.log('Veículo removido do banco (lote cancelado/sucata)');

            return {
                success: false,
                message: 'Leilão cancelado, inválido ou veículo descartado (sucata/grande monta).',
                action: 'deleted' as const,
                nextUrl
            };
        }

        // Preparar dados para salvar
        const dataLeilaoDate = dataLeilao ? new Date(dataLeilao) : new Date();
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const isActive = dataLeilaoDate >= hoje;

        if (!veiculo.leiloeiro) {
            veiculo.leiloeiro = getNomeLeiloeiro(url);
        }
        veiculo.dataLeilao = dataLeilaoDate;

        // Salvar no banco
        const { action } = await upsertVeiculo(veiculo, dataLeilaoDate, isActive);
        console.log(`Veículo ${action}: ${veiculo.descricao}`);

        return {
            success: true,
            data: veiculo,
            action,
            nextUrl
        };

    } catch (error: any) {
        console.error('Erro ao extrair dados:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Ocorreu um erro ao extrair os dados da página'
        });
    }
});
