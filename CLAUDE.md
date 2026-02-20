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
npm install              # Install dependencies
npm run dev              # Dev server on http://localhost:3000
npm run build            # Production build
npx nuxi typecheck      # Run TypeScript type checking
npx prisma migrate dev   # Run database migrations
npx prisma generate      # Regenerate Prisma client after schema changes
```

## Architecture

### Frontend Structure

```
app/
├── config/negocio.ts              # Business constants (tax rates, thresholds, scoring)
├── composables/
│   ├── useFormatacao.ts           # formatarValor(), formatarData()
│   ├── useVeiculoScore.ts         # Score/percentage/profit calculations + CSS classes
│   └── useLeiloeiro.ts            # Leiloeiro badge styling and labels
├── services/
│   ├── scrapperService.ts         # Client-side URL validation + API calls
│   └── veiculoRankerService.ts    # Vehicle scoring (0-10) with weighted factors
├── components/
│   ├── VeiculoCard.vue            # Vehicle card display
│   ├── VeiculoEditModal.vue       # Vehicle edit modal
│   ├── FiltroVeiculos.vue         # Filter panel for vehicle listing
│   ├── TabelaVeiculos.vue         # Vehicle table view
│   └── scrapper/
│       ├── ExtracacaoSequencial.vue  # Sequential extraction progress
│       ├── ResultadosLote.vue        # Batch results table
│       └── HistoricoExtracoes.vue    # Extraction history
├── pages/
│   ├── index.vue                  # Vehicle listing with filters
│   ├── scrapper.vue               # Scraping interface (individual/listing/sequential)
│   └── veiculo/[id].vue           # Vehicle detail page
└── types/veiculo.ts               # Veiculo interface (core domain model)
```

### Server Structure

```
server/
├── api/
│   ├── scrapper/
│   │   ├── extract.post.ts            # Single vehicle extraction
│   │   ├── extract-listing.post.ts    # Listing page extraction (get URLs)
│   │   ├── extract-sequential.post.ts # Sequential extraction with Puppeteer
│   │   └── batch.post.ts             # Batch extraction
│   └── veiculos/
│       ├── index.get.ts               # List vehicles (filters + pagination)
│       ├── [id].get.ts                # Get single vehicle
│       └── [id].put.ts                # Update vehicle (field whitelist enforced)
└── utils/
    ├── parser-base.ts                 # Shared: MARCAS_CONHECIDAS, extrairValorNumerico(), processarDescricao()
    ├── scrapper-parser.ts             # LeilaoParser for parquedosleiloes.com.br
    ├── leilo-parser.ts                # LeiloParser for leilo.com.br (single vehicle)
    ├── leilo-listing-parser.ts        # LeiloListingParser for leilo.com.br (listing pages)
    ├── leilo-puppeteer-parser.ts      # Puppeteer-based parser for dynamic content
    ├── leiloeiro-registry.ts          # Domain → parser routing registry
    ├── veiculo-repository.ts          # DB operations (upsert, delete)
    └── prisma.ts                      # Prisma client singleton
```

### Scraping Pipeline

1. **Client** (`app/services/scrapperService.ts`) — validates URL domain, calls server API
2. **Server API** (`server/api/scrapper/extract.post.ts`) — orchestrator: validate URL → fetch HTML → route to parser via registry → save via repository → return result
3. **Registry** (`server/utils/leiloeiro-registry.ts`) — maps domains to parsers
4. **Parsers** — site-specific HTML parsers that extract vehicle data into `Veiculo` objects:
   - `server/utils/scrapper-parser.ts` → `LeilaoParser` for parquedosleiloes.com.br
   - `server/utils/leilo-parser.ts` → `LeiloParser` for leilo.com.br
   - Both import shared functions from `server/utils/parser-base.ts`
5. **Repository** (`server/utils/veiculo-repository.ts`) — handles DB upsert/delete
6. **Ranking** (`app/services/veiculoRankerService.ts`) — scores vehicles 0-10 based on weighted factors: gross profit (35%), profit percentage (25%), mileage (20%), brand tier (15%), accident history (10%)

### Key Data Flow

- Scraped vehicles go through parsers → scored by `VeiculoRanker.calcularScore()` → saved to SQLite via Prisma
- The `Veiculo` type (`app/types/veiculo.ts`) is the core domain model shared between client and server
- Vehicles flagged as "sucata" or "grande monta" (salvage) are automatically discarded by parsers
- Business constants (tax rates, thresholds) are centralized in `app/config/negocio.ts`

### Adding a New Auction Site

1. Create a new parser in `server/utils/` following the pattern of existing parsers (import from `parser-base.ts`)
2. Register the domain and parser in `server/utils/leiloeiro-registry.ts`
3. Add domain to supported list in `app/services/scrapperService.ts` (`isUrlSupported` and `determinarLeiloeiro`)

## Conventions

- Code and comments are in Portuguese (Brazilian)
- Currency values use Brazilian format (R$ 1.000,00) — parsers convert to float
- Vehicle brands are stored uppercase
- All API error handling uses `throw createError()` (never `return createError()`)
- Frontend formatting/scoring logic lives in composables, not duplicated in components
- API update endpoints enforce field whitelists for security
