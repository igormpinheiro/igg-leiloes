// server/utils/leilo-parser.ts
import { parse, HTMLElement } from 'node-html-parser';
import type { Veiculo } from '~/types/veiculo';
import { extrairValorNumerico, processarDescricao } from './parser-base';

/**
 * Parser para leilo.com.br
 */
export class LeiloParser {
    static async parseLeiloBr(html: string, url: string): Promise<Veiculo | null> {
        try {
            const root = parse(html);

            const jsonLdData = this.extrairDadosJsonLd(html);

            const descricaoCompleta = jsonLdData?.nome || this.extrairTitulo(root);

            // Descartar sucata ou grande monta
            if (descricaoCompleta.toUpperCase().includes('SUCATA') ||
                descricaoCompleta.toUpperCase().includes('GRANDE MONTA')) {
                console.log('Veículo descartado por ser sucata ou grande monta:', descricaoCompleta);
                return null;
            }

            const { marca, descricao } = processarDescricao(descricaoCompleta, jsonLdData?.marca);
            const ano = jsonLdData?.ano || this.extrairAno(root);
            const quilometragem = jsonLdData?.quilometragem !== undefined && jsonLdData.quilometragem > 0
                ? jsonLdData.quilometragem
                : this.extrairQuilometragem(root);
            const sinistro = this.extrairSinistro(root);
            const valorMercado = jsonLdData?.valorMercado && jsonLdData.valorMercado > 0
                ? jsonLdData.valorMercado
                : this.extrairValorMercado(root);
            const { lanceInicial, lanceAtual } = (jsonLdData?.lanceInicial && jsonLdData.lanceInicial > 0)
                ? { lanceInicial: jsonLdData.lanceInicial, lanceAtual: jsonLdData.lanceAtual || jsonLdData.lanceInicial }
                : this.extrairLances(root);

            const veiculo: Veiculo = {
                id: Math.random().toString(36).substring(2, 15),
                descricao,
                marca,
                ano,
                quilometragem,
                sinistro,
                lanceInicial,
                lanceAtual,
                valorMercado,
                dataCaptura: new Date(),
                urlOrigem: url,
                active: true,
                leiloeiro: 'Leilo',
                patioUf: this.extrairPatioUf(root, url) || undefined,
            };

            return veiculo;
        } catch (error) {
            console.error('Erro ao parsear HTML do Leilo:', error);
            throw new Error('Falha ao extrair informações da página Leilo. Verifique se o formato do site mudou.');
        }
    }

    private static extrairPatioUf(root: HTMLElement, url: string): string | null {
        try {
            const labelNodes = root.querySelectorAll('.label-categoria');
            for (const label of labelNodes) {
                if (!label.textContent || !label.textContent.toLowerCase().includes('localização')) continue;

                const container =
                    label.parentElement?.parentElement ||
                    label.parentElement ||
                    label;

                const smallText = container.querySelector('small')?.textContent?.trim() || '';
                const matchSmall = smallText.match(/\/([A-Z]{2})\)/);
                if (matchSmall?.[1]) return matchSmall[1];

                const containerText = container.textContent || '';
                const matchText = containerText.match(/\/([A-Z]{2})\)/);
                if (matchText?.[1]) return matchText[1];

                const linkHref = container.querySelector('a[href*="/patios/"]')?.getAttribute('href') || '';
                const matchHref = linkHref.match(/\/patios\/[^/]+\/([A-Z]{2})\//);
                if (matchHref?.[1]) return matchHref[1];
            }
        } catch (error) {
            console.error('Erro ao extrair UF do pátio (HTML):', error);
        }

        try {
            const slugMatch = url.match(/\/leilao\/([^/]+)\//);
            const slug = slugMatch?.[1] || '';
            if (slug.includes('goias')) return 'GO';
            if (slug.includes('distrito-federal')) return 'DF';
        } catch (error) {
            console.error('Erro ao extrair UF do pátio (URL):', error);
        }

        return null;
    }

    private static extrairDadosJsonLd(html: string): {
        nome?: string,
        marca?: string,
        lanceInicial?: number,
        lanceAtual?: number,
        descricao?: string,
        ano?: string,
        quilometragem?: number,
        valorMercado?: number,
        situacao?: string
    } | null {
        try {
            // Estratégia 0: LoteSelecionadoState (mais completo)
            const loteStateMatch = html.match(/"LoteSelecionadoState"\s*:\s*\{/);
            if (loteStateMatch) {
                try {
                    const startIndex = loteStateMatch.index! + loteStateMatch[0].length - 1;
                    let bracketCount = 0;
                    let endIndex = startIndex;

                    for (let i = startIndex; i < Math.min(startIndex + 10000, html.length); i++) {
                        if (html[i] === '{') bracketCount++;
                        else if (html[i] === '}') {
                            bracketCount--;
                            if (bracketCount === 0) {
                                endIndex = i + 1;
                                break;
                            }
                        }
                    }

                    const stateJson = html.substring(startIndex, endIndex);
                    const state = JSON.parse(stateJson);

                    const resultado: any = {};

                    if (state.nome) {
                        resultado.nome = state.nome;
                        if (state.nome.includes('/')) {
                            resultado.marca = state.nome.split('/')[0].trim();
                        }
                    }

                    if (state.situacao) resultado.situacao = state.situacao;
                    if (state.descricao) resultado.descricao = state.descricao.trim();

                    if (state.veiculo) {
                        const veiculo = state.veiculo;
                        if (veiculo.km && veiculo.km > 0) resultado.quilometragem = veiculo.km;
                        if (veiculo.anoModelo && veiculo.anoFabricacao) {
                            resultado.ano = `${veiculo.anoFabricacao}/${veiculo.anoModelo}`;
                        } else if (veiculo.anoModelo) {
                            resultado.ano = veiculo.anoModelo.toString();
                        }
                        if (veiculo.valorMercado && veiculo.valorMercado > 0) {
                            resultado.valorMercado = veiculo.valorMercado;
                        }
                    }

                    if (state.valor) {
                        const valor = state.valor;
                        if (valor.minimo && valor.minimo > 0) {
                            resultado.lanceInicial = valor.minimo;
                            resultado.lanceAtual = valor.minimo;
                            if (valor.valorProposta && valor.valorProposta > 0) {
                                resultado.lanceAtual = valor.valorProposta;
                            } else if (valor.lance && valor.lance.valor && valor.lance.valor > 0) {
                                resultado.lanceAtual = valor.lance.valor;
                            }
                        }
                    }

                    if (Object.keys(resultado).length > 0) return resultado;
                } catch (e) {
                    console.error('Erro ao parsear LoteSelecionadoState:', e);
                }
            }

            // Estratégia 1: Objeto "valor"
            const valorBlockMatch = html.match(/"valor":\s*\{[^}]*(?:"lance":\s*\{[^}]*\})?[^}]*\}/);
            if (valorBlockMatch) {
                const valorBlock = valorBlockMatch[0];
                const minimoMatch = valorBlock.match(/"minimo"\s*:\s*(\d+)/);
                const lanceInicial = minimoMatch?.[1] ? parseInt(minimoMatch[1]) : 0;
                let lanceAtual = lanceInicial;

                const propostaMatch = valorBlock.match(/"valorProposta"\s*:\s*(\d+)/);
                if (propostaMatch?.[1]) {
                    lanceAtual = parseInt(propostaMatch[1]);
                } else {
                    const lanceValorMatch = valorBlock.match(/"lance":\s*\{[^}]*"valor"\s*:\s*(\d+)/);
                    if (lanceValorMatch?.[1]) lanceAtual = parseInt(lanceValorMatch[1]);
                }
                if (lanceInicial > 0) return { lanceInicial, lanceAtual };
            }

            // Estratégia 2: window.__Q_META__
            const qMetaMatch = html.match(/"price"\s*:\s*"([\d.]+)"/);
            if (qMetaMatch?.[1]) {
                const valor = parseFloat(qMetaMatch[1]);
                return { lanceInicial: valor, lanceAtual: valor };
            }

            // Estratégia 3: Meta tags description
            const metaDescMatch = html.match(/lance inicial de R\$\s*([\d.,]+)/i);
            if (metaDescMatch?.[1]) {
                const valor = extrairValorNumerico('R$ ' + metaDescMatch[1]);
                return { lanceInicial: valor, lanceAtual: valor };
            }

            return null;
        } catch (error) {
            console.error('Erro ao extrair dados estruturados:', error);
            return null;
        }
    }

    private static extrairTitulo(root: HTMLElement): string {
        try {
            const h1Element = root.querySelector('.nome-veiculo');
            if (h1Element) {
                let tituloText = '';
                h1Element.childNodes.forEach(node => {
                    if (node.nodeType === 3) {
                        const texto = node.text.trim();
                        if (texto) tituloText = texto;
                    }
                });

                if (tituloText) return tituloText;

                const h1Text = h1Element.textContent;
                const pElement = h1Element.querySelector('p');
                if (pElement) {
                    const pText = pElement.textContent;
                    if (h1Text && pText) return h1Text.replace(pText, '').trim();
                }
            }

            return (
                root.querySelector('.nome-veiculo')?.innerText.split('\n').pop()?.trim() ||
                root.querySelector('h1')?.innerText.split('\n').pop()?.trim() ||
                'Veículo sem descrição'
            );
        } catch (error) {
            console.error('Erro ao extrair título:', error);
            return 'Veículo sem descrição';
        }
    }

    private static extrairLances(root: HTMLElement): { lanceInicial: number, lanceAtual: number } {
        try {
            const valorLoteElements = root.querySelectorAll('.valor-lote');
            for (const valorLoteElement of valorLoteElements) {
                const spanElement = valorLoteElement.querySelector('span');
                if (spanElement) {
                    const valor = extrairValorNumerico(spanElement.textContent.trim());
                    if (valor > 0) return { lanceInicial: valor, lanceAtual: valor };
                }

                const valor = extrairValorNumerico(valorLoteElement.textContent.trim());
                if (valor > 0) return { lanceInicial: valor, lanceAtual: valor };
            }

            const monetarioLanceElement = root.querySelector('.monetario-lance');
            if (monetarioLanceElement) {
                const inputs = monetarioLanceElement.querySelectorAll('input');
                for (const input of inputs) {
                    const value = input.getAttribute('value');
                    if (value && (value.includes('R$') || value.includes('R '))) {
                        const valor = extrairValorNumerico(value);
                        if (valor > 0) return { lanceInicial: valor, lanceAtual: valor };
                    }
                }
            }

            const lanceElements = root.querySelectorAll('*');
            for (const element of lanceElements) {
                const text = element.textContent.trim();
                if (text.includes('Valor Lance') || text.includes('Lance Inicial') ||
                    text.includes('Lance Atual') || text.includes('Lance:')) {
                    const valor = extrairValorNumerico(text);
                    if (valor > 0) return { lanceInicial: valor, lanceAtual: valor };
                }
            }

            return { lanceInicial: 0, lanceAtual: 0 };
        } catch (error) {
            console.error('Erro ao extrair lances:', error);
            return { lanceInicial: 0, lanceAtual: 0 };
        }
    }

    private static extrairSinistro(root: HTMLElement): boolean {
        const tipoRetomadaElements = root.querySelectorAll('.text-categoria');
        for (const element of tipoRetomadaElements) {
            const parentText = element.parentNode?.textContent?.toLowerCase() || '';
            const text = element.textContent.trim().toLowerCase();
            if (parentText.includes('tipo retomada') && text.includes('recuperado de seguradora')) {
                return true;
            }
        }

        const descricaoElement = root.querySelector('.descricao-veiculo');
        if (descricaoElement) {
            const descricaoText = descricaoElement.textContent.toLowerCase();
            if (descricaoText.includes('média monta') ||
                descricaoText.includes('media monta') ||
                descricaoText.includes('enchente') ||
                descricaoText.includes('incêndio') ||
                descricaoText.includes('incendio') ||
                descricaoText.includes('sinistro')) {
                return true;
            }
        }

        return false;
    }

    private static extrairAno(root: HTMLElement): string {
        const anosElements = root.querySelectorAll('.text-categoria');
        for (const element of anosElements) {
            const text = element.textContent.trim();
            const yearPattern = /\b(19|20)\d{2}\/(19|20)?\d{2,4}\b/;
            const yearMatch = text.match(yearPattern);
            if (yearMatch) return yearMatch[0];
        }

        const tituloCategorias = root.querySelectorAll('.text-weight-600');
        for (const elemento of tituloCategorias) {
            const texto = elemento.textContent.trim();
            const yearPattern = /\b(19|20)\d{2}\/(19|20)?\d{2,4}\b/;
            const yearMatch = texto.match(yearPattern);
            if (yearMatch) return yearMatch[0];
        }

        return 'N/A';
    }

    private static extrairQuilometragem(root: HTMLElement): number {
        const kmElements = root.querySelectorAll('.text-categoria');
        for (const element of kmElements) {
            const text = element.textContent.trim().toLowerCase();
            const kmPattern = /(\d{1,3}(?:\.\d{3})*|\d+)\s*km/i;
            const kmMatch = text.match(kmPattern);
            if (kmMatch?.[1] && !text.includes('/')) {
                const kmValue = parseInt(kmMatch[1].replace(/\./g, ''));
                if (kmValue > 0 && kmValue < 1000000) return kmValue;
            }
        }

        const allElements = root.querySelectorAll('*');
        for (const element of allElements) {
            const text = element.textContent.trim().toLowerCase();
            if (text.includes('quilometragem') || text.includes('odômetro') || text.includes('odometro')) {
                const kmPattern = /(\d{1,3}(?:\.\d{3})*|\d+)\s*km/i;
                const kmMatch = text.match(kmPattern);
                if (kmMatch?.[1]) {
                    const kmValue = parseInt(kmMatch[1].replace(/\./g, ''));
                    if (kmValue > 0 && kmValue < 1000000) return kmValue;
                }
            }
        }

        return 0;
    }

    private static extrairValorMercado(root: HTMLElement): number {
        const valorElements = root.querySelectorAll('.text-categoria');
        for (const element of valorElements) {
            const parentText = element.parentNode?.textContent?.toLowerCase() || '';
            const text = element.textContent.trim();
            if (parentText.includes('valor mercado') || parentText.includes('valor de mercado')) {
                return extrairValorNumerico(text);
            }
        }

        const todosElements = root.querySelectorAll('*');
        for (const element of todosElements) {
            const text = element.textContent.trim();
            if (text.includes('Valor Mercado') || text.includes('Valor de Mercado')) {
                const valorPattern = /R\$\s*([\d.,]+)/;
                const valorMatch = text.match(valorPattern);
                if (valorMatch && valorMatch[1]) return extrairValorNumerico(valorMatch[1]);
            }
        }

        return 0;
    }
}
