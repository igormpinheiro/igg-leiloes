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

- `Leiloeiro`
  - `id`, `descricao`, `dominio` (unique)
  - `comissao`, `taxaAdm`, `taxaDespachante`, `taxaVistoria`

- `Veiculo`
  - `modelo` (old `descricao` name field)
  - `descricao` (free text page description)
  - `sinistro` as enum (`TipoSinistro`)
  - new fields `ipvaPago`, `numeroLote`, `leiloeiroId`
  - `active` is computed at runtime (not stored)

## Architecture

### Frontend Structure

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
    ├── veiculo-runtime.ts
    └── prisma.ts
```

### Home UX Notes (`app/pages/index.vue`)

- Home uses a **single dense table mode** (`TabelaVeiculos`) and no cards toggle.
- Filter UX is **auto-apply**:
  - debounce (~250ms) for search and numeric ranges
  - immediate apply for toggles/select fields
- Active filters are shown as removable chips.
- Filters panel is collapsible on desktop and rendered as a drawer on mobile.
- Current data strategy is still client-side (`/api/veiculos?limit=10000`) with local filtering/sorting.
- Added filter by `leiloeiroId`.
- `active` is computed in runtime.
- Score explainability in `TabelaVeiculos`:
  - desktop: hover/focus on the score badge opens the tooltip
  - mobile: tapping the score badge toggles open/close
  - tooltip shows score components, weights, risk metrics, and gate penalties

### Scoring Notes

- Source of truth: `app/services/veiculoRankerService.ts` (`calcularBreakdown`).
- In UI code, use `useVeiculoScore` to avoid duplicated logic:
  - `getScoreExplicacao(veiculo)` to explain score rationale in the tooltip
  - `getScoreBreakdown(veiculo)` for raw breakdown access
- Current weights (`CONFIG_NEGOCIO.pesos`):
  - ROI: 0.4
  - Absolute profit: 0.2
  - Mileage: 0.2
  - Brand: 0.1
  - Data quality: 0.1

### Scraping Pipeline

1. **Client** (`app/services/scrapperService.ts`) — validates URL domain, calls server API.
2. **Server API** (`server/api/scrapper/extract.post.ts`) — validate URL -> fetch HTML -> route parser -> resolve `leiloeiroId` -> upsert via repository.
3. **Registry** (`server/utils/leiloeiro-registry.ts`) — maps domains to parsers.
4. **Parsers** — site-specific HTML parsers extracting `Veiculo` fields (`modelo`, `descricao`, `sinistro`, `ipvaPago`, `numeroLote`).
5. **Repository** (`server/utils/veiculo-repository.ts`) — DB upsert/delete.
6. **Ranking** (`app/services/veiculoRankerService.ts`) — score 0-10 with weighted factors.

### Key Data Flow

- Scraped vehicles go through parsers -> score calculation -> save to SQLite via Prisma.
- `Veiculo` in `app/types/veiculo.ts` remains the shared core domain model.
- Vehicles flagged as `Sucata` or `GrandeMonta` are discarded by parsers.
- Leiloeiro fees are persisted in relation table and used in score/profit calculations.

### Adding a New Auction Site

1. Create a parser in `server/utils/` (reuse `parser-base.ts`).
2. Register domain and parser in `server/utils/leiloeiro-registry.ts`.
3. Ensure a `Leiloeiro` record exists for that domain (seed or DB insert).
4. Update supported-domain validation in `app/services/scrapperService.ts` if needed.

## Conventions

- Code and comments are in Portuguese (Brazilian).
- Currency values use Brazilian format (`R$ 1.000,00`) and parsers convert to float.
- Vehicle brands are stored uppercase.
- All API error handling uses `throw createError()`.
- Frontend formatting/scoring logic lives in composables/services.
- API update endpoints enforce field whitelists for security.
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
