// server/utils/leilo-listing-parser.ts

import { parse } from 'node-html-parser';

/**
 * Parser para extrair lista de lotes de uma página de listagem do Leilo.com.br
 *
 * Como o site é uma SPA (Single Page Application) com renderização client-side,
 * os dados dos lotes não estão disponíveis no HTML inicial. Esta classe extrai
 * URLs reais dos links presentes no HTML inicial da página.
 */
export class LeiloListingParser {
    /**
     * Extrai URLs de lotes individuais de uma listagem do Leilo
     *
     * @param url URL da listagem (ex: https://leilo.com.br/leilao/goiania-goias/carros)
     * @returns Promise com objeto contendo URLs, data do leilão e metadados
     *
     * **Estratégia:**
     * 1. Faz fetch do HTML da página de listagem
     * 2. Extrai a data do leilão do estado embutido no JavaScript
     * 3. Parseia o HTML e extrai URLs reais dos links de lotes
     * 4. Retorna URLs completas conforme aparecem na página
     *
     * **Limitações:**
     * - O HTML inicial não contém todos os lotes (a SPA carrega mais lotes sob demanda via scroll)
     * - Apenas os lotes presentes no HTML inicial serão extraídos (~50-60% do total)
     * - Para extrair 100% dos lotes use o Puppeteer parser
     */
    static async extractLoteUrls(url: string): Promise<{
        loteUrls: string[];
        dataLeilao: string | null;
        uuid: string;
        nome: string;
    }> {
        try {
            console.log(`[LeiloListingParser] Processando listagem: ${url}`);

            // 1. Fazer fetch do HTML
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar listagem: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();
            console.log(`[LeiloListingParser] HTML recebido: ${html.length} caracteres`);

            // 2. Extrair dados do estado inicial
            const leilaoData = this.extrairDadosLeilao(html);

            if (!leilaoData || !leilaoData.uuid) {
                throw new Error('Não foi possível identificar o UUID do leilão. Verifique se a URL está correta.');
            }

            if (leilaoData.totalLotes === 0) {
                console.warn('[LeiloListingParser] Leilão não possui lotes disponíveis');
                return {
                    loteUrls: [],
                    dataLeilao: null,
                    uuid: leilaoData.uuid,
                    nome: leilaoData.nome
                };
            }

            console.log(`[LeiloListingParser] Leilão encontrado:`, {
                uuid: leilaoData.uuid,
                nome: leilaoData.nome,
                totalLotes: leilaoData.totalLotes,
                situacao: leilaoData.situacao
            });

            // 3. Extrair data do leilão
            const dataLeilao = this.extrairDataLeilao(html);
            console.log(`[LeiloListingParser] Data do leilão: ${dataLeilao || 'não encontrada'}`);

            // 4. Extrair URLs reais dos links na página
            const loteUrls = this.extrairUrlsLote(html);

            if (loteUrls.length === 0) {
                console.warn('[LeiloListingParser] Nenhuma URL de lote encontrada no HTML');
                return {
                    loteUrls: [],
                    dataLeilao,
                    uuid: leilaoData.uuid,
                    nome: leilaoData.nome
                };
            }

            console.log(`[LeiloListingParser] ${loteUrls.length} URLs de lotes extraídas`);

            return {
                loteUrls,
                dataLeilao,
                uuid: leilaoData.uuid,
                nome: leilaoData.nome
            };

        } catch (error: any) {
            console.error('[LeiloListingParser] Erro ao extrair URLs:', error);
            throw new Error(`Falha ao processar listagem do Leilo: ${error.message}`);
        }
    }

    /**
     * Extrai URLs reais dos lotes do HTML
     *
     * IMPORTANTE: O Leilo.com.br é uma SPA (Single Page Application) que renderiza os lotes
     * dinamicamente com JavaScript. O HTML inicial não contém os links dos lotes.
     *
     * Este método retorna array vazio, indicando que o modo HTML scraping não é funcional
     * para este site. Use o Puppeteer parser para extração completa.
     *
     * @param html HTML da página
     * @returns Array vazio (lotes não estão no HTML inicial)
     */
    private static extrairUrlsLote(html: string): string[] {
        console.warn('[LeiloListingParser] HTML inicial não contém lotes (SPA). Use Puppeteer para extração completa.');
        return [];
    }

    /**
     * Extrai informações do leilão do HTML
     *
     * A página do Leilo embute um objeto JavaScript `window.__INITIAL_STATE__` que contém:
     * - PaginaLeilaoState: { lotes: [], lotesTotal: number }
     * - LeilaoSelecionadoState ou slug na URL mapeado para UUID
     *
     * @param html HTML da página
     * @returns Objeto com uuid, nome, totalLotes e situacao do leilão
     */
    private static extrairDadosLeilao(html: string): {
        uuid: string;
        nome: string;
        totalLotes: number;
        situacao: string;
    } | null {
        try {
            // Estratégia 1: Buscar "lotesTotal" que aparece no PaginaLeilaoState
            const lotesTotalMatch = html.match(/"lotesTotal"\s*:\s*(\d+)/);
            const totalLotes = lotesTotalMatch ? parseInt(lotesTotalMatch[1]) : 0;

            if (totalLotes === 0) {
                console.warn('[LeiloListingParser] lotesTotal não encontrado ou é zero');
                return null;
            }

            // Estratégia 2: Buscar UUID do leilão na canonical URL ou no estado
            // Padrão: <link rel="canonical" href="https://leilo.com.br/leilao/goiania-goias/carros">
            // Precisamos mapear o slug para o UUID real do leilão

            // 2a. Tentar encontrar UUID no PaginaLeilaoState ou LeilaoSelecionadoState
            // O objeto leilão pode usar "id" ou "uid" dependendo do contexto
            const leilaoIdMatch = html.match(/"leilao"\s*:\s*{\s*"id"\s*:\s*"([^"]+)"/);
            const leilaoUidMatch = html.match(/"leilao"\s*:\s*{\s*"uid"\s*:\s*"([^"]+)"/);

            const leilaoStateMatch = leilaoIdMatch || leilaoUidMatch;
            if (leilaoStateMatch && leilaoStateMatch[1]) {
                const uuid = leilaoStateMatch[1];
                console.log(`[LeiloListingParser] UUID encontrado via estado: ${uuid}`);

                // Tentar extrair também o nome do leilão
                const nomeMatch = html.match(/"leilao"\s*:\s*{[^}]*"nome"\s*:\s*"([^"]+)"/);
                const nome = nomeMatch && nomeMatch[1] ? nomeMatch[1] : 'Leilão';

                return {
                    uuid,
                    nome,
                    totalLotes,
                    situacao: 'Ativo'
                };
            }

            // 2b. Buscar no LeiloesSiteState por leilões ativos na região/categoria
            const leiloesSiteStateMatch = html.match(/"LeiloesSiteState"\s*:\s*(\[.*?\])/);
            if (leiloesSiteStateMatch) {
                try {
                    // Extrair o array completo (pode ser muito grande)
                    const stateText = leiloesSiteStateMatch[1];

                    // Buscar por leilões não executados/cancelados
                    // Procurar por padrões como: {"uid":"...","nome":"...","situacao":"...","quantidadeLotes":...}
                    const leilaoPattern = /"uid"\s*:\s*"([^"]+)"[^}]*"nome"\s*:\s*"([^"]+)"[^}]*"situacao"\s*:\s*"([^"]+)"[^}]*"quantidadeLotes"\s*:\s*(\d+)/g;

                    let match;
                    const leiloesEncontrados: Array<{
                        uuid: string;
                        nome: string;
                        situacao: string;
                        qtdLotes: number;
                    }> = [];

                    while ((match = leilaoPattern.exec(stateText)) !== null) {
                        const uuid = match[1];
                        const nome = match[2];
                        const situacao = match[3];
                        const qtdLotes = match[4];

                        // Verificar se todos os valores foram capturados
                        if (uuid && nome && situacao && qtdLotes) {
                            // Filtrar apenas leilões ativos (não executados/cancelados)
                            if (situacao !== 'EXECUTADO' && situacao !== 'CANCELADO') {
                                leiloesEncontrados.push({
                                    uuid,
                                    nome,
                                    situacao,
                                    qtdLotes: parseInt(qtdLotes)
                                });
                            }
                        }
                    }

                    // Se encontrou exatamente um leilão ativo com o total de lotes correto, usar ele
                    const leiloesComMesmoTotal = leiloesEncontrados.filter(l => l.qtdLotes === totalLotes);

                    if (leiloesComMesmoTotal.length === 1) {
                        const leilao = leiloesComMesmoTotal[0];
                        console.log(`[LeiloListingParser] Leilão identificado por match de totalLotes: ${leilao.nome}`);

                        return {
                            uuid: leilao.uuid,
                            nome: leilao.nome,
                            totalLotes,
                            situacao: leilao.situacao
                        };
                    }

                    // Se há múltiplos leilões com mesmo total, tentar identificar pelo slug da URL
                    // (estratégia adicional: procurar no nome do leilão termos que batam com o slug)
                    // Por enquanto, se há apenas um leilão ativo, usar ele
                    if (leiloesEncontrados.length === 1) {
                        const leilao = leiloesEncontrados[0];
                        console.log(`[LeiloListingParser] Único leilão ativo encontrado: ${leilao.nome}`);

                        return {
                            uuid: leilao.uuid,
                            nome: leilao.nome,
                            totalLotes,
                            situacao: leilao.situacao
                        };
                    }

                    // Se não conseguiu identificar univocamente, logar os leilões encontrados
                    if (leiloesEncontrados.length > 0) {
                        console.log(`[LeiloListingParser] Múltiplos leilões ativos encontrados (${leiloesEncontrados.length}):`);
                        leiloesEncontrados.forEach(l => {
                            console.log(`  - ${l.uuid}: ${l.nome} (${l.qtdLotes} lotes, ${l.situacao})`);
                        });

                        // Usar o primeiro como fallback
                        const leilao = leiloesEncontrados[0];
                        console.warn(`[LeiloListingParser] Usando primeiro leilão como fallback: ${leilao.nome}`);

                        return {
                            uuid: leilao.uuid,
                            nome: leilao.nome,
                            totalLotes,
                            situacao: leilao.situacao
                        };
                    }

                } catch (parseError) {
                    console.error('[LeiloListingParser] Erro ao parsear LeiloesSiteState:', parseError);
                }
            }

            console.error('[LeiloListingParser] Não foi possível extrair UUID do leilão');
            return null;

        } catch (error) {
            console.error('[LeiloListingParser] Erro ao extrair dados do leilão:', error);
            return null;
        }
    }

    /**
     * Extrai a data do leilão do HTML
     *
     * Busca pela data no objeto leilão embutido no estado inicial.
     * A data está no formato ISO 8601: "2026-02-19T12:30:00.000Z"
     *
     * @param html HTML da página
     * @returns String com a data em formato ISO 8601, ou null se não encontrada
     */
    private static extrairDataLeilao(html: string): string | null {
        try {
            // Buscar no objeto leilão: "data":"2026-02-19T12:30:00.000Z"
            const dataMatch = html.match(/"leilao"\s*:\s*{[^}]*"data"\s*:\s*"([^"]+)"/);

            if (dataMatch && dataMatch[1]) {
                const data = dataMatch[1];
                console.log(`[LeiloListingParser] Data extraída: ${data}`);
                return data;
            }

            // Fallback: buscar qualquer campo "data" que pareça uma data ISO
            const dataFallbackMatch = html.match(/"data"\s*:\s*"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)"/);

            if (dataFallbackMatch && dataFallbackMatch[1]) {
                const data = dataFallbackMatch[1];
                console.log(`[LeiloListingParser] Data extraída (fallback): ${data}`);
                return data;
            }

            console.warn('[LeiloListingParser] Data do leilão não encontrada no HTML');
            return null;

        } catch (error) {
            console.error('[LeiloListingParser] Erro ao extrair data do leilão:', error);
            return null;
        }
    }
}
