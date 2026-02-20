// server/api/scrapper/extract-listing.post.ts
import { parse } from 'node-html-parser';
import { LeiloListingParser } from '../../utils/leilo-listing-parser';
import { LeiloPuppeteerParser } from '../../utils/leilo-puppeteer-parser';

export default defineEventHandler(async (event) => {
    try {
        const { url, fullExtraction = true } = await readBody(event);

        if (!url) {
            throw createError({
                statusCode: 400,
                statusMessage: 'URL é obrigatória'
            });
        }

        // Verificar se a URL é de um site suportado
        const isParqueDosLeiloes = url.includes('parquedosleiloes.com.br');
        const isLeilo = url.includes('leilo.com.br');

        if (!isParqueDosLeiloes && !isLeilo) {
            throw createError({
                statusCode: 400,
                statusMessage: 'URL não suportada. Atualmente suportamos: Parque dos Leilões e Leilo.'
            });
        }

        // Processar Leilo com modo rápido ou completo
        if (isLeilo) {
            try {
                if (fullExtraction) {
                    // Modo completo: Puppeteer com scroll infinito (100% dos lotes, ~20s)
                    console.log('[Leilo] Usando modo completo (Puppeteer)...');
                    const data = await LeiloPuppeteerParser.extractFullListing(url);

                    return {
                        success: true,
                        url,
                        total: data.total,
                        loteUrls: data.loteUrls,
                        dataLeilao: data.dataLeilao,
                        method: 'puppeteer'
                    };
                } else {
                    // Modo rápido: HTML scraping (não funciona para Leilo - retorna dados de fallback)
                    console.log('[Leilo] Modo rápido não suportado para este site (SPA). Use fullExtraction=true.');
                    const data = await LeiloListingParser.extractLoteUrls(url);

                    return {
                        success: true,
                        url,
                        total: 0,
                        loteUrls: [],
                        dataLeilao: data.dataLeilao,
                        method: 'html-scraping',
                        warning: 'Leilo.com.br é uma SPA que carrega lotes dinamicamente. HTML scraping não funciona. Use fullExtraction=true (Puppeteer) para extrair os lotes.'
                    };
                }
            } catch (error: any) {
                console.error('Erro ao processar listagem do Leilo:', error);
                throw createError({
                    statusCode: 500,
                    statusMessage: `Erro ao processar listagem do Leilo: ${error.message}`
                });
            }
        }

        // Processar Parque dos Leilões (lógica original)

        // Fazer a requisição para a URL da listagem
        console.log(`Fazendo requisição para listagem: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Erro ao buscar URL da listagem: ${response.status} ${response.statusText}`);
            throw createError({
                statusCode: 500,
                statusMessage: `Não foi possível acessar a URL da listagem. Status: ${response.status}`
            });
        }

        const html = await response.text();
        console.log(`Recebido HTML da listagem com ${html.length} caracteres`);

        // Parsear o HTML
        const root = parse(html);

        // Encontrar links para lotes individuais
        const loteLinks: string[] = [];

        // Tentar diferentes seletores para acomodar diferentes layouts do site
        const auctionLotCards = root.querySelectorAll('.auction-lot-card a, .card.auction-lot-card a');

        for (const card of auctionLotCards) {
            const href = card.getAttribute('href');
            if (href && href.includes('/lote/')) {
                // Converter para URL absoluta se necessário
                const fullUrl = href.startsWith('http') ? href : `https://www.parquedosleiloes.com.br${href}`;

                // Adicionar apenas URLs únicas
                if (!loteLinks.includes(fullUrl)) {
                    loteLinks.push(fullUrl);
                }
            }
        }

        // Se não encontrou nenhum link, tentar outras estratégias
        if (loteLinks.length === 0) {
            // Procurar qualquer link que contenha '/lote/' no href
            const allLinks = root.querySelectorAll('a');
            for (const link of allLinks) {
                const href = link.getAttribute('href');
                if (href && href.includes('/lote/')) {
                    const fullUrl = href.startsWith('http') ? href : `https://www.parquedosleiloes.com.br${href}`;
                    if (!loteLinks.includes(fullUrl)) {
                        loteLinks.push(fullUrl);
                    }
                }
            }
        }

        console.log(`Encontrados ${loteLinks.length} links de lotes`);

        return {
            success: true,
            url: url,
            total: loteLinks.length,
            loteUrls: loteLinks
        };

    } catch (error: any) {
        console.error('Erro ao extrair URLs da listagem:', error);

        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Ocorreu um erro ao extrair as URLs da listagem'
        });
    }
});