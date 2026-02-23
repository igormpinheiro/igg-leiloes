# IGG Leiloes

Ferramenta de scraping e ranking de veiculos em leiloes do mercado brasileiro. Extrai lotes dos sites de leilao (parquedosleiloes.com.br, leilo.com.br), pontua os veiculos com base em lucratividade e desejabilidade, e armazena tudo em SQLite local.

## Stack

- **Framework**: Nuxt 3 (modo de compatibilidade v4) com Vue 3
- **Banco de Dados**: SQLite via Prisma ORM
- **Estilizacao**: Tailwind CSS
- **Parsing HTML**: node-html-parser (scraping server-side)
- **Linguagem**: TypeScript

## Setup

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
```

## Comandos

```bash
npm run dev            # servidor em http://localhost:3000
npm run build          # build de producao
npm run preview        # preview da build
npm run db:migrate     # prisma migrate dev
npm run db:seed        # seed dos leiloeiros
npx nuxi typecheck     # checagem de tipos
```

## Remodelagem de dados (atual)

- `Leiloeiro` virou entidade relacional com taxas:
  - `descricao`, `dominio`, `comissao`, `taxaAdm`, `taxaDespachante`, `taxaVistoria`
- `Veiculo.descricao` (antigo nome do carro) foi renomeado para `Veiculo.modelo`
- Novo `Veiculo.descricao` contem texto livre extraido da pagina
- Novos campos em `Veiculo`: `ipvaPago`, `numeroLote`, `leiloeiroId`
- Novos campos em `Veiculo` para candidatos:
  - `isCandidato`, `candidatoOrdem`, `lanceLimite`
  - `candidatoStatus`, `candidatoUltimoErro`, `candidatoAtualizadoEm`
- `sinistro` agora e enum (`TipoSinistro`) com valor `Nenhum` para ausencia
- `active` nao e mais persistido no banco; e calculado em runtime (timezone de negocio)

## Funcionalidades

### Scraping

- Extracao individual por URL
- Extracao por listagem
- Extracao sequencial com progresso
- Extracao em lote
- Descarte automatico de lotes invalidados (`Sucata` / `GrandeMonta`)

### Ranking e score

Cada veiculo recebe nota de 0 a 10 com pesos:

| Fator | Peso |
|---|---|
| ROI ajustado por risco | 40% |
| Lucro absoluto ajustado | 20% |
| Quilometragem | 20% |
| Tier da marca | 10% |
| Qualidade dos dados (lance/mercado) | 10% |

- O score usa `scoreBase * 10` com penalidades (`gates`) de `-2`:
  - ROI ajustado abaixo do minimo (`CONFIG_NEGOCIO.roi.regular`)
  - dados financeiros insuficientes (sem lance ou sem valor de mercado)
- A camada de risco considera sinistro, flags de descricao e incerteza de km.

### Home (tabela e filtros)

- Home em modo tabela densa (`TabelaVeiculos`)
- Filtros autoaplicaveis:
  - debounce para busca e ranges (ano, lance, km)
  - aplicacao imediata para toggles/selects
- Filtro por `leiloeiroId`
- Filtro por `apenas candidatos`
- Filtro sem sinistro baseado em `TipoSinistro.Nenhum`
- Ordenacao por `modelo`, ano, km, FIPE, lucro e score
- `active` calculado no carregamento/resposta da API
- Score com explicacao tecnica na tabela (`TabelaVeiculos`):
  - desktop: hover/focus no badge de score
  - mobile: toque no badge abre/fecha
  - detalhes: componentes do score, pesos, risco total e penalidades aplicadas
- Cada linha possui estrela para marcar/desmarcar candidato a lance

### Candidatos (`/candidatos`)

- Pagina dedicada para estrategia de lance dos favoritos
- Navegacao por abas: **Ativos** e **Historico** (inativos)
- Reordenacao por botoes (↑/↓), com persistencia em `candidatoOrdem`
- `lanceLimite` persistido no banco por veiculo
- `lanceLimite` e calculado em ~60% do mercado, arredondado para baixo em multiplos do incremento global
- Mudanca no incremento global recalcula automaticamente o `lanceLimite` de todos os candidatos
- `lanceAtual` da simulacao e local (localStorage `candidatos-lances`)
- Card mostra:
  - lote, dados principais e chips
  - simulacao com incremento de lance para `lanceAtual` e `lanceLimite` (com botoes +/-)
  - resumo rapido com enfase visual e classes de cor de ROI/Lucro
  - tabela de estimativa de lucro com base em `lanceAtual` local
  - score normal e alerta de refresh quando houver erro/invalido
- Botao "Atualizar Todos" faz refresh sequencial dos candidatos ativos
  - em falha, candidato e mantido e recebe status de alerta

## Sites suportados

| Site | Dominio | Parser |
|---|---|---|
| Parque dos Leiloes | parquedosleiloes.com.br | `LeilaoParser` |
| Leilo | leilo.com.br | `LeiloParser` |

## Estrutura (resumo)

```
app/
├── config/negocio.ts
├── composables/
│   ├── useFormatacao.ts
│   ├── useVeiculoScore.ts
│   ├── useLeiloeiro.ts
│   └── useDataLeilao.ts
├── services/
│   ├── scrapperService.ts
│   └── veiculoRankerService.ts
├── components/
├── pages/
└── types/veiculo.ts

server/
├── api/
│   ├── scrapper/
│   │   └── candidatos/refresh.post.ts
│   └── veiculos/
│       ├── candidatos.get.ts
│       ├── candidatos/lance-limite.put.ts
│       ├── candidatos/ordem.put.ts
│       └── [id]/
│           ├── candidato.post.ts
│           └── lance-limite.patch.ts
└── utils/
    ├── extract-veiculo.ts
    ├── lance-limite.ts
    ├── parser-base.ts
    ├── scrapper-parser.ts
    ├── leilo-parser.ts
    ├── leiloeiro-registry.ts
    ├── veiculo-repository.ts
    ├── veiculo-runtime.ts
    └── prisma.ts
```

## Adicionando novo site de leilao

1. Criar parser em `server/utils/` usando `parser-base.ts`
2. Registrar dominio e parser em `server/utils/leiloeiro-registry.ts`
3. Garantir dominio cadastrado em `Leiloeiro` (seed ou insert manual)
