// server/utils/leilo-puppeteer-parser.ts

import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Parser para extrair 100% dos lotes de uma página de listagem do Leilo.com.br usando Puppeteer
 *
 * Como o site é uma SPA (Single Page Application) com scroll infinito, o HTML inicial
 * contém apenas ~60% dos lotes. Este parser usa um navegador headless para simular
 * scroll até o fim da página e carregar todos os lotes dinamicamente.
 *
 * **Vantagens:**
 * - ✅ Extrai 100% dos lotes (não apenas os do HTML inicial)
 * - ✅ Extrai data do leilão automaticamente
 * - ✅ Robusto contra mudanças na estrutura do HTML inicial
 *
 * **Desvantagens:**
 * - ⚠️ Mais lento que HTML scraping (~20 segundos vs ~2 segundos)
 * - ⚠️ Requer Puppeteer instalado (~300MB incluindo Chromium)
 * - ⚠️ Maior consumo de memória (~100-200MB por navegador)
 */
export class LeiloPuppeteerParser {
    /**
     * Extrai 100% dos lotes usando Puppeteer e scroll infinito
     *
     * @param url URL da listagem (ex: https://leilo.com.br/leilao/goiania-goias/carros)
     * @returns Promise com dados completos da listagem
     *
     * **Processo:**
     * 1. Lança navegador headless
     * 2. Navega para URL da listagem
     * 3. Aguarda carregamento inicial
     * 4. Executa scroll infinito até não carregar mais lotes
     * 5. Extrai todos os lotes do DOM final
     * 6. Extrai data do leilão
     * 7. Fecha navegador
     * 8. Retorna dados completos
     */
    static async extractFullListing(url: string): Promise<{
        loteUrls: string[];
        dataLeilao: string | null;
        uuid: string;
        nome: string;
        total: number;
    }> {
        let browser: Browser | null = null;

        try {
            console.log(`[Puppeteer] Iniciando extração completa: ${url}`);

            // 1. Lançar navegador headless
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage', // Reduz uso de memória
                    '--disable-gpu',
                    '--disable-software-rasterizer'
                ]
            });

            const page = await browser.newPage();

            // Headers para evitar detecção de bot
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );
            await page.setViewport({ width: 1920, height: 1080 });

            // 2. Navegar para URL e aguardar carregamento inicial
            console.log('[Puppeteer] Navegando para URL...');
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            console.log('[Puppeteer] Página carregada, aguardando elementos...');

            // Aguardar carregamento inicial dos lotes (esperar pelo menos 1 lote aparecer)
            try {
                await page.waitForSelector('.q-card', { timeout: 10000 });
            } catch (error) {
                console.warn('[Puppeteer] Timeout ao aguardar lotes - tentando continuar...');
            }

            // 3. Executar scroll infinito para carregar todos os lotes
            await this.scrollToLoadAll(page);

            // 4. Extrair URLs dos links na página
            const loteUrls = await this.extrairUrlsLote(page);

            console.log(`[Puppeteer] Total de URLs extraídas: ${loteUrls.length}`);

            // 5. Extrair data do leilão do HTML
            const html = await page.content();
            const dataLeilao = this.extrairDataLeilao(html);

            // 6. Extrair dados do leilão para metadados
            const leilaoData = this.extrairDadosLeilao(html);

            return {
                loteUrls,
                dataLeilao,
                uuid: leilaoData?.uuid || 'unknown',
                nome: leilaoData?.nome || 'Leilão',
                total: loteUrls.length
            };

        } catch (error: any) {
            console.error('[Puppeteer] Erro ao extrair listagem completa:', error);
            throw new Error(`Falha ao processar listagem com Puppeteer: ${error.message}`);
        } finally {
            // SEMPRE fechar navegador para liberar recursos
            if (browser) {
                await browser.close();
                console.log('[Puppeteer] Navegador fechado');
            }
        }
    }

    /**
     * Executa scroll infinito até carregar todos os lotes
     *
     * Estratégia:
     * - Rola até o fim da página repetidamente
     * - Aguarda 2 segundos para SPA carregar mais lotes
     * - Para quando a altura da página não mudar por 3 iterações consecutivas
     *
     * @param page Página do Puppeteer
     */
    private static async scrollToLoadAll(page: Page): Promise<void> {
        let previousLinkCount = 0;
        let stableCount = 0;
        let iteration = 0;

        console.log('[Puppeteer] Iniciando scroll infinito...');

        while (stableCount < 5) {
            iteration++;

            // Scroll para o fim da página
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

            // Aguardar carregamento da SPA (tempo maior para garantir carregamento)
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Contar quantos links de lote existem na página
            const currentLinkCount = await page.evaluate(() => {
                const links = document.querySelectorAll('a[href*="/leilao/"]');
                return Array.from(links).filter(link => {
                    const href = link.getAttribute('href');
                    return href && href.match(/[0-9a-f]{8}-[0-9a-f]{4}/);
                }).length;
            });

            console.log(
                `[Puppeteer] Iteração ${iteration}: ${currentLinkCount} links de lote encontrados (anterior: ${previousLinkCount})`
            );

            // Verificar se o número de links parou de crescer
            if (currentLinkCount === previousLinkCount && currentLinkCount > 0) {
                stableCount++;
            } else {
                stableCount = 0; // Reset se houve mudança
            }

            previousLinkCount = currentLinkCount;

            // Limite de segurança: parar após 50 iterações
            if (iteration >= 50) {
                console.warn('[Puppeteer] Limite de 50 iterações atingido, parando scroll');
                break;
            }
        }

        console.log(`[Puppeteer] Scroll completo - ${previousLinkCount} links de lote carregados`);
    }

    /**
     * Extrai URLs reais dos lotes da página usando Puppeteer
     *
     * Executa JavaScript no contexto da página para extrair todos os links
     * que apontam para páginas de lotes individuais.
     *
     * @param page Página do Puppeteer
     * @returns Array com URLs completas dos lotes
     */
    private static async extrairUrlsLote(page: Page): Promise<string[]> {
        try {
            // Executar JavaScript no contexto da página para extrair links
            const urls = await page.evaluate(() => {
                const urlsSet = new Set<string>();
                const links = document.querySelectorAll('a');

                for (const link of links) {
                    const href = link.getAttribute('href');

                    // Verificar se é um link de lote
                    // Padrão: /leilao/{slug-cidade}/{categoria}/{marca}/{modelo}/ano.{ano}/{uuid}
                    if (href && href.includes('/leilao/') && href.match(/[0-9a-f]{8}-[0-9a-f]{4}/)) {
                        // Converter para URL absoluta
                        const fullUrl = href.startsWith('http')
                            ? href
                            : `https://leilo.com.br${href}`;

                        urlsSet.add(fullUrl);
                    }
                }

                return Array.from(urlsSet);
            });

            console.log(`[Puppeteer] ${urls.length} URLs únicas extraídas da página`);

            return urls;

        } catch (error) {
            console.error('[Puppeteer] Erro ao extrair URLs de lote:', error);
            return [];
        }
    }

    /**
     * Extrai dados do leilão do HTML
     *
     * @param html HTML da página
     * @returns Objeto com uuid e nome do leilão
     */
    private static extrairDadosLeilao(html: string): {
        uuid: string;
        nome: string;
    } | null {
        try {
            // Buscar UUID no objeto leilão
            const leilaoIdMatch = html.match(/"leilao"\s*:\s*{\s*"id"\s*:\s*"([^"]+)"/);
            const leilaoUidMatch = html.match(/"leilao"\s*:\s*{\s*"uid"\s*:\s*"([^"]+)"/);

            const leilaoStateMatch = leilaoIdMatch || leilaoUidMatch;

            if (leilaoStateMatch && leilaoStateMatch[1]) {
                const uuid = leilaoStateMatch[1];

                // Extrair nome do leilão
                const nomeMatch = html.match(/"leilao"\s*:\s*{[^}]*"nome"\s*:\s*"([^"]+)"/);
                const nome = nomeMatch && nomeMatch[1] ? nomeMatch[1] : 'Leilão';

                return { uuid, nome };
            }

            console.error('[Puppeteer] UUID do leilão não encontrado');
            return null;
        } catch (error) {
            console.error('[Puppeteer] Erro ao extrair dados do leilão:', error);
            return null;
        }
    }

    /**
     * Extrai a data do leilão do HTML
     *
     * @param html HTML da página
     * @returns String com a data em formato ISO 8601, ou null se não encontrada
     */
    private static extrairDataLeilao(html: string): string | null {
        try {
            // Buscar no objeto leilão: "data":"2026-02-19T12:30:00.000Z"
            const dataMatch = html.match(/"leilao"\s*:\s*{[^}]*"data"\s*:\s*"([^"]+)"/);

            if (dataMatch && dataMatch[1]) {
                return dataMatch[1];
            }

            // Fallback: buscar qualquer campo "data" que pareça uma data ISO
            const dataFallbackMatch = html.match(
                /"data"\s*:\s*"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)"/
            );

            if (dataFallbackMatch && dataFallbackMatch[1]) {
                return dataFallbackMatch[1];
            }

            console.warn('[Puppeteer] Data do leilão não encontrada no HTML');
            return null;
        } catch (error) {
            console.error('[Puppeteer] Erro ao extrair data do leilão:', error);
            return null;
        }
    }
}
