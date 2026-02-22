# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vehicle auction scraper and ranking tool (Brazilian market). Scrapes vehicle listings from auction sites (parquedosleiloes.com.br, leilo.com.br), scores them based on profitability/desirability, and stores them in a local SQLite database.

## Tech Stack

- **Framework**: Nuxt 3 (v4 compatibility mode) with Vue 3
- **Database**: SQLite via Prisma ORM
- **Styling**: Tailwind CSS
- **HTML Parsing**: node-html-parser (server-side scraping)
- **Language**: TypeScript throughout

## Commands

```bash
npm install
npm run dev
npm run build
npx nuxi typecheck
npm run db:migrate      # prisma migrate dev
npm run db:seed         # prisma db seed
npx prisma generate
```

## Data Model (Current)

### Prisma entities

- `Leiloeiro` (new relation table)
  - `id`, `descricao`, `dominio` (unique)
  - `comissao`, `taxaAdm`, `taxaDespachante`, `taxaVistoria`

- `Veiculo`
  - `modelo` = old vehicle name field
  - `descricao` = free text extracted from source page
  - `sinistro` = enum (`TipoSinistro`) with `Nenhum` as no-claim state
  - new fields: `ipvaPago`, `numeroLote`, `leiloeiroId`
  - `active` is **not persisted**; computed at runtime

### Domain enums

- `TipoSinistro`:
  - `Nenhum`
  - `IndicioSinistro`
  - `RecuperadoSinistro`
  - `PequenaMonta`
  - `MediaMonta`
  - `GrandeMonta`
  - `Sucata`

## Architecture

### Frontend Structure

```
app/
├── config/negocio.ts
├── composables/
│   ├── useFormatacao.ts
│   ├── useVeiculoScore.ts
│   ├── useLeiloeiro.ts
│   └── useDataLeilao.ts            # active runtime calculation (timezone-aware)
├── services/
│   ├── scrapperService.ts
│   └── veiculoRankerService.ts
├── components/
│   ├── VeiculoCard.vue
│   ├── VeiculoEditModal.vue
│   ├── FiltroVeiculos.vue
│   ├── TabelaVeiculos.vue
│   └── scrapper/
│       ├── ExtracacaoSequencial.vue
│       ├── ResultadosLote.vue
│       └── HistoricoExtracoes.vue
├── pages/
│   ├── index.vue
│   ├── scrapper.vue
│   └── veiculo/[id].vue
└── types/veiculo.ts
```

### Server Structure

```
server/
├── api/
│   ├── scrapper/
│   │   ├── extract.post.ts
│   │   ├── extract-listing.post.ts
│   │   ├── extract-sequential.post.ts
│   │   └── batch.post.ts
│   └── veiculos/
│       ├── index.get.ts
│       ├── [id].get.ts
│       └── [id].put.ts
└── utils/
    ├── parser-base.ts
    ├── scrapper-parser.ts
    ├── leilo-parser.ts
    ├── leilo-listing-parser.ts
    ├── leilo-puppeteer-parser.ts
    ├── leiloeiro-registry.ts
    ├── veiculo-repository.ts
    ├── veiculo-runtime.ts          # domain normalization + active calculation
    └── prisma.ts
```

## Scraping Pipeline

1. **Client** (`app/services/scrapperService.ts`) validates URL domain and calls server API.
2. **API** (`server/api/scrapper/extract.post.ts`) validates URL, fetches HTML, routes parser, resolves `leiloeiroId`, upserts vehicle.
3. **Registry** (`server/utils/leiloeiro-registry.ts`) routes domain -> parser.
4. **Parsers** map source HTML into `Veiculo` shape (`modelo`, `descricao`, `sinistro`, `ipvaPago`, `numeroLote`, etc.).
5. **Repository** (`server/utils/veiculo-repository.ts`) handles DB upsert/delete.
6. **Ranking** (`app/services/veiculoRankerService.ts`) computes score 0-10.

## Home UX Notes (`app/pages/index.vue`)

- Single dense table mode (`TabelaVeiculos`).
- Auto-apply filters:
  - debounce (~250ms) for search and numeric ranges
  - immediate apply for toggles/select fields
- Active filter chips are removable.
- Desktop collapsible filters + mobile drawer.
- Client-side strategy remains `GET /api/veiculos?limit=10000` and local sorting/filtering.
- Added filter by `leiloeiroId`.
- `active` is computed, not persisted.

## Adding a New Auction Site

1. Create a parser in `server/utils/` (reuse `parser-base.ts`).
2. Register domain and parser in `server/utils/leiloeiro-registry.ts`.
3. Ensure `Leiloeiro` exists for that domain (seed or DB insert) so `leiloeiroId` can be resolved.
4. If needed, add domain to supported list in `app/services/scrapperService.ts`.

## Conventions

- Code and comments are in Portuguese (Brazilian).
- Currency values use Brazilian format (`R$ 1.000,00`), parsers convert to float.
- Vehicle brands are stored uppercase.
- API errors must use `throw createError()`.
- Frontend formatting/scoring logic should stay in composables/services (avoid duplication in components).
- Update endpoints enforce field whitelists.
