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
npm install          # Install dependencies
npm run dev          # Dev server on http://localhost:3000
npm run build        # Production build
npx prisma migrate dev   # Run database migrations
npx prisma generate      # Regenerate Prisma client after schema changes
```

## Architecture

### Scraping Pipeline

1. **Client** (`app/services/scrapperService.ts`) — validates URL domain, calls server API
2. **Server API** (`server/api/scrapper/extract.post.ts`) — fetches HTML from auction URL, routes to correct parser
3. **Parsers** — site-specific HTML parsers that extract vehicle data into `Veiculo` objects:
   - `server/utils/scrapper-parser.ts` → `LeilaoParser` for parquedosleiloes.com.br
   - `server/utils/leilo-parser.ts` → `LeiloParser` for leilo.com.br
4. **Ranking** (`app/services/veiculoRankerService.ts`) — scores vehicles 0-10 based on weighted factors: gross profit (35%), profit percentage (25%), mileage (20%), brand tier (15%), accident history (10%)

### Key Data Flow

- Scraped vehicles go through parsers → scored by `VeiculoRanker.calcularScore()` → saved to SQLite via Prisma
- The `Veiculo` type (`app/types/veiculo.ts`) is the core domain model shared between client and server
- Vehicles flagged as "sucata" or "grande monta" (salvage) are automatically discarded by the Leilo parser

### Adding a New Auction Site

1. Create a new parser in `server/utils/` following the pattern of existing parsers
2. Add domain to supported list in `app/services/scrapperService.ts` (`isUrlSupported` and `determinarLeiloeiro`)
3. Add routing logic in `server/api/scrapper/extract.post.ts`

## Conventions

- Code and comments are in Portuguese (Brazilian)
- Currency values use Brazilian format (R$ 1.000,00) — parsers convert to float
- Vehicle brands are stored uppercase
