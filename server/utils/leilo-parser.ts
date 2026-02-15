// server/utils/leilo-parser.ts
import { parse, HTMLElement } from 'node-html-parser';
import type { Veiculo } from '~/types/veiculo';
import { VeiculoRanker } from '~/services/veiculoRankerService';

/**
 * Classe para parsear site de leilões Leilo e extrair informações de veículos
 */
export class LeiloParser {
    /**
     * Parseia uma página de leilão do Leilo e extrai informações do veículo
     * @param html HTML da página
     * @param url URL original
     * @returns Objeto com dados do veículo ou null se for sucata/grande monta
     */
    static async parseLeiloBr(html: string, url: string): Promise<Veiculo | null> {
        try {
            const root = parse(html);

            // Estratégia 1: Tentar extrair dados estruturados do HTML inline
            const jsonLdData = this.extrairDadosJsonLd(html);

            // Extrair descrição completa (título)
            const descricaoCompleta = jsonLdData?.nome || this.extrairTitulo(root);

            // Verificar se é sucata ou grande monta (nesse caso, descartar)
            if (descricaoCompleta.toUpperCase().includes('SUCATA') ||
                descricaoCompleta.toUpperCase().includes('GRANDE MONTA')) {
                console.log('Veículo descartado por ser sucata ou grande monta:', descricaoCompleta);
                return null;
            }

            // Processar descrição para obter marca e descrição
            const { marca, descricao } = this.processarDescricao(descricaoCompleta, jsonLdData?.marca);

            // Extrair ano
            const ano = this.extrairAno(root);

            // Extrair quilometragem
            const quilometragem = this.extrairQuilometragem(root);

            // Verificar sinistro
            const sinistro = this.extrairSinistro(root);

            // Extrair valor de mercado
            const valorMercado = this.extrairValorMercado(root);

            // Extrair lances - usa dados estruturados primeiro se disponível
            const { lanceInicial, lanceAtual } = (jsonLdData?.lanceInicial && jsonLdData.lanceInicial > 0)
                ? { lanceInicial: jsonLdData.lanceInicial, lanceAtual: jsonLdData.lanceAtual || jsonLdData.lanceInicial }
                : this.extrairLances(root);

            // Gerar ID único
            const id = Math.random().toString(36).substring(2, 15);

            // Calcular score com base nos dados extraídos
            const score = VeiculoRanker.calcularScore({
                id,
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
                active: true
            });

            // Construir objeto Veiculo
            const veiculo: Veiculo = {
                id,
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
                leiloeiro: 'Leilo'
            };

            return veiculo;
        } catch (error) {
            console.error('Erro ao parsear HTML do Leilo:', error);
            throw new Error('Falha ao extrair informações da página Leilo. Verifique se o formato do site mudou.');
        }
    }

    /**
     * Extrai dados do JSON-LD (Schema.org) presente no HTML
     * @param html HTML completo da página
     * @returns Objeto com dados extraídos ou null se não encontrar
     */
    private static extrairDadosJsonLd(html: string): { nome?: string, marca?: string, lanceInicial?: number, lanceAtual?: number } | null {
        try {
            // Estratégia 1: Extrair do objeto "valor":{"minimo":..., "valorProposta":...}
            // Este objeto contém tanto o lance inicial quanto o atual
            // Buscar um bloco maior que inclua o objeto valor e o lance aninhado
            const valorBlockMatch = html.match(/"valor":\s*\{[^}]*(?:"lance":\s*\{[^}]*\})?[^}]*\}/);
            if (valorBlockMatch) {
                const valorBlock = valorBlockMatch[0];

                // Extrair lance inicial (minimo)
                const minimoMatch = valorBlock.match(/"minimo"\s*:\s*(\d+)/);
                const lanceInicial = minimoMatch ? parseInt(minimoMatch[1]) : 0;

                // Extrair lance atual (valorProposta ou lance.valor)
                let lanceAtual = lanceInicial; // Default: usa o inicial

                // Primeiro tenta pegar valorProposta (pode ser null ou número)
                const propostaMatch = valorBlock.match(/"valorProposta"\s*:\s*(\d+)/);
                if (propostaMatch) {
                    lanceAtual = parseInt(propostaMatch[1]);
                } else {
                    // Se valorProposta for null, tenta pegar lance.valor do mesmo bloco
                    const lanceValorMatch = valorBlock.match(/"lance":\s*\{[^}]*"valor"\s*:\s*(\d+)/);
                    if (lanceValorMatch) {
                        lanceAtual = parseInt(lanceValorMatch[1]);
                    }
                    // Se lance.valor também for null, lanceAtual já está = lanceInicial
                }
                if (lanceInicial > 0) {
                    return { lanceInicial, lanceAtual };
                }
            }

            // Estratégia 2: Extrair de window.__Q_META__ -> "price": "54000.00"
            const qMetaMatch = html.match(/"price"\s*:\s*"([\d.]+)"/);
            if (qMetaMatch) {
                const valor = parseFloat(qMetaMatch[1]);
                return { lanceInicial: valor, lanceAtual: valor };
            }

            // Estratégia 3: Extrair das meta tags description
            const metaDescMatch = html.match(/lance inicial de R\$\s*([\d.,]+)/i);
            if (metaDescMatch) {
                const valorText = metaDescMatch[1];
                const valor = this.extrairValorNumerico('R$ ' + valorText);
                return { lanceInicial: valor, lanceAtual: valor };
            }

            return null;

        } catch (error) {
            console.error('Erro ao extrair dados estruturados:', error);
            return null;
        }
    }

    /**
     * Extrai o título/nome do veículo
     */
    private static extrairTitulo(root: HTMLElement): string {
        try {
            // Estratégia 1: Obter o texto direto que está na tag h1, mas não dentro de <p>
            const h1Element = root.querySelector('.nome-veiculo');
            if (h1Element) {
                // O texto do título geralmente está como último nó de texto no h1, após a tag <p>
                let tituloText = '';
                h1Element.childNodes.forEach(node => {
                    // Se for um nó de texto (nodeType 3) e não estiver dentro de <p>
                    if (node.nodeType === 3) {
                        const texto = node.text.trim();
                        if (texto) {
                            tituloText = texto;
                        }
                    }
                });

                if (tituloText) {
                    return tituloText;
                }

                // Se não conseguiu pelo método acima, tentar extrair diretamente
                // Obter conteúdo de h1, excluindo o conteúdo da tag <p>
                const h1Text = h1Element.textContent;
                const pElement = h1Element.querySelector('p');
                if (pElement) {
                    const pText = pElement.textContent;
                    if (h1Text && pText) {
                        return h1Text.replace(pText, '').trim();
                    }
                }
            }

            // Estratégia 2: Procurar outras formas de obter o título
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

    /**
     * Processa a descrição para separar marca e descrição,
     * removendo a marca do início da descrição quando apropriado
     * @param descricaoCompleta Descrição completa do veículo
     * @param marcaJsonLd Marca extraída do JSON-LD (opcional, tem prioridade)
     */
    private static processarDescricao(descricaoCompleta: string, marcaJsonLd?: string): { marca: string, descricao: string } {
        let marca = marcaJsonLd || '';
        let descricao = descricaoCompleta;

        // Se já temos a marca do JSON-LD, usar ela e remover da descrição se necessário
        if (marcaJsonLd) {
            // Remover a marca do início da descrição se estiver lá
            const regex = new RegExp(`^${marcaJsonLd}[\\s\\/\\-]+`, 'i');
            descricao = descricao.replace(regex, '').trim();

            // Se a descrição começa com "Leilão de", remover também
            descricao = descricao.replace(/^Leilão\s+de\s+\w+\s+/i, '').trim();

            return { marca: marcaJsonLd, descricao };
        }

        // Padrões comuns em descrições de veículos
        const marcasConhecidas = ['FIAT', 'VOLKSWAGEN', 'VW', 'TOYOTA', 'HONDA', 'HYUNDAI', 'CHEVROLET', 'FORD',
            'RENAULT', 'NISSAN', 'BMW', 'MERCEDES', 'AUDI', 'BYD', 'JEEP', 'LAND ROVER', 'MITSUBISHI', 'KIA',
            'PEUGEOT', 'CITROEN', 'YAMAHA', 'HONDA', 'SUZUKI', 'KAWASAKI'];

        // Caso 1: Formato MARCA/MODELO
        if (descricaoCompleta.includes('/')) {
            const partes = descricaoCompleta.split('/');
            marca = partes[0].trim();

            // Se o formato é MARCA/MODELO, remover a marca da descrição
            if (partes.length > 1) {
                descricao = partes[1].trim();

                // Se houver mais partes depois da primeira barra, juntá-las
                if (partes.length > 2) {
                    descricao = partes.slice(1).join('/').trim();
                }

                return { marca, descricao };
            }
        }

        // Caso 2: Verificar se começa com uma marca conhecida
        for (const marcaConhecida of marcasConhecidas) {
            if (descricaoCompleta.toUpperCase().startsWith(marcaConhecida)) {
                marca = marcaConhecida;

                // Remover a marca do início da descrição
                descricao = descricaoCompleta.substring(marcaConhecida.length).trim();

                // Remover caracteres extras como espaços ou traços do início
                descricao = descricao.replace(/^[\s\-\/]+/, '');

                return { marca, descricao };
            }
        }

        // Caso 3: Se não encontrou uma marca específica, usar o primeiro "token" como marca
        if (!marca && descricaoCompleta.includes(' ')) {
            const partes = descricaoCompleta.split(' ');
            marca = partes[0];
            descricao = partes.slice(1).join(' ');
        }

        // Se a marca começar com caracteres especiais como "***", removê-los
        marca = marca.replace(/^\*+\s*/, '');

        return { marca, descricao };
    }

    /**
     * Extrair valores de lances
     */
    private static extrairLances(root: HTMLElement): { lanceInicial: number, lanceAtual: number } {
        try {
            // Estratégia 1: Procurar pelo valor do lote na classe valor-lote
            const valorLoteElements = root.querySelectorAll('.valor-lote');
            for (const valorLoteElement of valorLoteElements) {
                // O valor geralmente está em um span dentro deste elemento
                const spanElement = valorLoteElement.querySelector('span');
                if (spanElement) {
                    const valorText = spanElement.textContent.trim();
                    const valor = this.extrairValorNumerico(valorText);

                    if (valor > 0) {
                        return { lanceInicial: valor, lanceAtual: valor };
                    }
                }

                // Fallback: tentar extrair diretamente do elemento se não houver span
                const valorText = valorLoteElement.textContent.trim();
                const valor = this.extrairValorNumerico(valorText);
                if (valor > 0) {
                    return { lanceInicial: valor, lanceAtual: valor };
                }
            }

            // Estratégia 2: Procurar nos elementos da descrição detalhada dos valores
            const monetarioLanceElement = root.querySelector('.monetario-lance');
            if (monetarioLanceElement) {
                const inputs = monetarioLanceElement.querySelectorAll('input');
                for (const input of inputs) {
                    const value = input.getAttribute('value');
                    if (value && (value.includes('R$') || value.includes('R '))) {
                        const valor = this.extrairValorNumerico(value);
                        if (valor > 0) {
                            return { lanceInicial: valor, lanceAtual: valor };
                        }
                    }
                }
            }

            // Estratégia 3: Procurar em elementos com texto de lance
            const lanceElements = root.querySelectorAll('*');
            for (const element of lanceElements) {
                const text = element.textContent.trim();

                // Procurar por padrões como "Valor Lance: R$ 50.600,00"
                if (text.includes('Valor Lance') || text.includes('Lance Inicial') ||
                    text.includes('Lance Atual') || text.includes('Lance:')) {
                    const valor = this.extrairValorNumerico(text);
                    if (valor > 0) {
                        return { lanceInicial: valor, lanceAtual: valor };
                    }
                }
            }

            return { lanceInicial: 0, lanceAtual: 0 };
        } catch (error) {
            console.error('Erro ao extrair lances:', error);
            return { lanceInicial: 0, lanceAtual: 0 };
        }
    }

    // [Outros métodos permanecem iguais]

    /**
     * Extrai informação de sinistro - Lógica atualizada conforme requisitos
     */
    private static extrairSinistro(root: HTMLElement): boolean {
        // 1. Verificar se "Tipo Retomada" é "Recuperado de Seguradora"
        const tipoRetomadaElements = root.querySelectorAll('.text-categoria');
        for (const element of tipoRetomadaElements) {
            const parentText = element.parentNode?.textContent?.toLowerCase() || '';
            const text = element.textContent.trim().toLowerCase();

            if (parentText.includes('tipo retomada') && text.includes('recuperado de seguradora')) {
                return true;
            }
        }

        // 2. Verificar termos específicos na descrição
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

    /**
     * Extrai o ano do veículo
     */
    private static extrairAno(root: HTMLElement): string {
        // Procura o ano nas categorias do veículo
        const anosElements = root.querySelectorAll('.text-categoria');

        for (const element of anosElements) {
            const text = element.textContent.trim();

            // Padrão de ano comum: YYYY/YYYY
            const yearPattern = /\b(19|20)\d{2}\/(19|20)?\d{2,4}\b/;
            const yearMatch = text.match(yearPattern);

            if (yearMatch) {
                return yearMatch[0];
            }
        }

        // Se não encontrar, tenta extrair de outras partes da página
        const tituloCategorias = root.querySelectorAll('.text-weight-600');
        for (const elemento of tituloCategorias) {
            const texto = elemento.textContent.trim();
            const yearPattern = /\b(19|20)\d{2}\/(19|20)?\d{2,4}\b/;
            const yearMatch = texto.match(yearPattern);

            if (yearMatch) {
                return yearMatch[0];
            }
        }

        return 'N/A';
    }

    /**
     * Extrai a quilometragem do veículo
     */
    private static extrairQuilometragem(root: HTMLElement): number {
        const kmElements = root.querySelectorAll('.text-categoria');

        for (const element of kmElements) {
            const text = element.textContent.trim().toLowerCase();

            // Padrão de quilometragem: números seguidos OBRIGATORIAMENTE por "km"
            const kmPattern = /(\d{1,3}(?:\.\d{3})*|\d+)\s*km/i;
            const kmMatch = text.match(kmPattern);

            if (kmMatch && !text.includes('/')) { // Evitar confundir ano com km
                const numerosApenas = kmMatch[1].replace(/\./g, '');
                const kmValue = parseInt(numerosApenas);

                // Verificar se é um valor plausível para quilometragem
                if (kmValue > 0 && kmValue < 1000000) {
                    return kmValue;
                }
            }
        }

        // Se não encontrar nos elementos categoria, procurar no HTML inteiro com contexto
        const allElements = root.querySelectorAll('*');
        for (const element of allElements) {
            const text = element.textContent.trim().toLowerCase();

            // Procurar por padrões específicos de quilometragem
            if (text.includes('quilometragem') || text.includes('odômetro') || text.includes('odometro')) {
                const kmPattern = /(\d{1,3}(?:\.\d{3})*|\d+)\s*km/i;
                const kmMatch = text.match(kmPattern);

                if (kmMatch) {
                    const numerosApenas = kmMatch[1].replace(/\./g, '');
                    const kmValue = parseInt(numerosApenas);

                    if (kmValue > 0 && kmValue < 1000000) {
                        return kmValue;
                    }
                }
            }
        }

        return 0;
    }

    /**
     * Extrai o valor de mercado do veículo
     */
    private static extrairValorMercado(root: HTMLElement): number {
        // Procura por valores de mercado na página
        const valorElements = root.querySelectorAll('.text-categoria');

        for (const element of valorElements) {
            const parentText = element.parentNode?.textContent?.toLowerCase() || '';
            const text = element.textContent.trim();

            if (parentText.includes('valor mercado') || parentText.includes('valor de mercado')) {
                return this.extrairValorNumerico(text);
            }
        }

        // Se não encontrar em elementos específicos, procura na página inteira
        const todosElements = root.querySelectorAll('*');
        for (const element of todosElements) {
            const text = element.textContent.trim();

            if (text.includes('Valor Mercado') || text.includes('Valor de Mercado')) {
                const valorPattern = /R\$\s*([\d.,]+)/;
                const valorMatch = text.match(valorPattern);

                if (valorMatch && valorMatch[1]) {
                    return this.extrairValorNumerico(valorMatch[1]);
                }
            }
        }

        return 0;
    }

    /**
     * Extrai um valor numérico de uma string (ex: "R$ 10.000,00" -> 10000)
     */
    private static extrairValorNumerico(texto: string): number {
        if (!texto) return 0;

        // Extrair números com R$ ou R (com $ opcional)
        const valorPattern = /R\s*\$?\s*([\d.,]+)/;
        const valorMatch = texto.match(valorPattern);

        if (valorMatch && valorMatch[1]) {
            // Remover símbolos não numéricos exceto vírgula e ponto
            const valor = valorMatch[1].replace(/[^\d,\.]/g, '');

            // Converter formato brasileiro (1.000,00) para número
            if (valor.includes(',')) {
                return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
            }

            return parseFloat(valor) || 0;
        }

        // Tentar extrair qualquer número na string
        const numerosPattern = /([\d.,]+)/;
        const numerosMatch = texto.match(numerosPattern);

        if (numerosMatch && numerosMatch[1]) {
            const valor = numerosMatch[1].replace(/[^\d,\.]/g, '');

            if (valor.includes(',')) {
                return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
            }

            return parseFloat(valor) || 0;
        }

        return 0;
    }
}