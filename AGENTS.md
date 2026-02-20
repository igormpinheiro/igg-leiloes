# AGENTS.md

This file provides guidance when working with code in this repository.

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
npx nuxi typecheck       # Run TypeScript type checking
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
│   ├── VeiculoCard.vue            # Vehicle card (kept for reuse outside index if needed)
│   ├── VeiculoEditModal.vue       # Vehicle edit modal
│   ├── FiltroVeiculos.vue         # Auto-applied filter panel (desktop + mobile drawer usage)
│   ├── TabelaVeiculos.vue         # Dense/sticky vehicle table view (single mode on index)
│   └── scrapper/
│       ├── ExtracacaoSequencial.vue  # Sequential extraction progress
│       ├── ResultadosLote.vue        # Batch results table
│       └── HistoricoExtracoes.vue    # Extraction history
├── pages/
│   ├── index.vue                  # Vehicle listing (table-only, no cards toggle)
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
│   │   └── batch.post.ts              # Batch extraction
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

### Home UX Notes (`app/pages/index.vue`)

- Home uses a **single dense table mode** (`TabelaVeiculos`) and no cards toggle.
- Filter UX is **auto-apply**:
  - debounce (~250ms) for search and numeric ranges
  - immediate apply for toggles/select fields
- Active filters are shown as removable chips.
- Filters panel is collapsible on desktop and rendered as a drawer on mobile.
- Current data strategy is still client-side (`/api/veiculos?limit=10000`) with local filtering/sorting.

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

## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.
### Available skills
- skill-creator: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: /home/igor/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). (file: /home/igor/.codex/skills/.system/skill-installer/SKILL.md)
### How to use skills
- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1) After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2) When `SKILL.md` references relative paths (e.g., `scripts/foo.py`), resolve them relative to the skill directory listed above first, and only consider other paths if needed.
  3) If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  4) If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  5) If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
- Context hygiene:
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - When variants exist (frameworks, providers, domains), pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.
