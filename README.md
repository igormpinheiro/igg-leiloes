# IGG Leiloes

Ferramenta de scraping e ranking de veiculos em leiloes do mercado brasileiro. Extrai listagens de sites de leilao (parquedosleiloes.com.br, leilo.com.br), pontua os veiculos com base em lucratividade e desejabilidade, e armazena tudo em um banco SQLite local.

## Stack

- **Framework**: Nuxt 3 (modo de compatibilidade v4) com Vue 3
- **Banco de Dados**: SQLite via Prisma ORM
- **Estilizacao**: Tailwind CSS
- **Parsing HTML**: node-html-parser (scraping server-side)
- **Linguagem**: TypeScript

## Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev
```

## Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento sera iniciado em `http://localhost:3000`.

## Producao

```bash
npm run build
npm run preview
```

## Funcionalidades

### Scraping de Veiculos

- **Extracao individual**: cola a URL de um lote especifico e extrai os dados do veiculo
- **Extracao por listagem**: cola a URL de uma pagina de listagem e extrai todas as URLs dos lotes
- **Extracao sequencial**: processa multiplos lotes em sequencia com acompanhamento de progresso
- **Extracao em lote**: processa multiplas URLs de uma vez

### Ranking e Score

Cada veiculo recebe uma nota de 0 a 10 baseada em fatores ponderados:

| Fator | Peso |
|---|---|
| Lucro bruto estimado | 35% |
| Porcentagem de lucro | 25% |
| Quilometragem | 20% |
| Tier da marca | 15% |
| Historico de sinistro | 10% |

### Listagem e Filtros (Home)

- Home focada em **tabela unica** (modo cards descontinuado na pagina inicial)
- Layout denso com **cabecalho sticky** e primeira coluna sticky
- Filtros autoaplicaveis:
  - debounce para busca e ranges (ano, lance e km)
  - aplicacao imediata para toggles e UF
- Chips de filtros ativos com remocao individual
- Painel de filtros colapsavel no desktop e drawer no mobile
- Ordenacao por colunas (descricao, ano, km, FIPE, lucro e score)
- Atualizacao e edicao de veiculos diretamente na tabela

## Sites Suportados

| Site | Dominio | Parser |
|---|---|---|
| Parque dos Leiloes | parquedosleiloes.com.br | `LeilaoParser` |
| Leilo | leilo.com.br | `LeiloParser` |

## Estrutura do Projeto

```
app/
├── config/negocio.ts          # Constantes de negocio (taxas, thresholds)
├── composables/               # Logica compartilhada (formatacao, score, leiloeiro)
├── components/                # Componentes Vue reutilizaveis
├── pages/                     # Paginas (listagem, scrapper, detalhe)
├── services/                  # Servicos client-side (scrapper, ranker)
└── types/                     # Tipos TypeScript

server/
├── api/                       # Endpoints da API (scrapper, veiculos)
└── utils/                     # Parsers, registry, repository, Prisma
```

## Adicionando um Novo Site de Leilao

1. Criar um parser em `server/utils/` importando funcoes de `parser-base.ts`
2. Registrar dominio e parser em `server/utils/leiloeiro-registry.ts`
3. Adicionar dominio na lista de suportados em `app/services/scrapperService.ts`
