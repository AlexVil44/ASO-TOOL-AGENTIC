# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

App Store market research tool for iOS indie developers. One slash command (`/market`) runs a full analysis — competitor table, download estimates, country opportunity scores, GO/NO-GO verdict — using the free iTunes Search API + Tavily web search. No build step, no npm install, no paid SaaS.

## Setup

The only required configuration is a Tavily API key (free tier: 1000 req/month):

```bash
cp .claude/scripts/.env.example .claude/scripts/.env
# Edit .env and set TAVILY_API_KEY=tvly-your-key-here
```

## Running things

**Slash command (primary usage):**
```
/market meditation app        # named niche
/market                       # autonomous mode — agent picks the best niche
```

**CLI tools (for development and testing):**
```bash
node src/itunes.js "meditation" us 10          # iTunes search CLI
node .claude/scripts/tavily-search.mjs "meditation app iOS market 2026"  # Tavily CLI
```

**Direct iTunes API (no auth, no Node required):**
```bash
curl "https://itunes.apple.com/search?term=KEYWORD&entity=software&country=us&limit=20"
curl "https://itunes.apple.com/lookup?id=ID1,ID2&country=us"
```

## Architecture

### Data flow

```
/market [keyword]
    │
    ├── Phase 0   (if no keyword) autonomous niche discovery
    │               2× Tavily → 6–10 candidates
    │               iTunes /search on us → pre-qualify each with score formula
    │               picks best, announces choice, continues without user input
    │
    ├── Phase 1   3× Tavily → market size, competitors, trends (include current year)
    ├── Phase 2a  iTunes /search × 15 countries, top 10 apps each (max 3 parallel)
    ├── Phase 2b  iTunes /lookup → deep data on top 5 competitors by review count
    ├── Phase 3   score each country with opportunity formula
    └── Phase 4   write report to reports/YYYY-MM-DD-niche-slug.md
```

### Source modules

- **`src/itunes.js`** — iTunes Search + Lookup API wrapper. Exports `searchApps(keyword, country, limit)` and `lookupApps(trackIds, country)`. Each app is normalized into: `{ trackId, name, developer, rating, reviews, downloadsEst, downloadsEstFmt, price, currency, genre, releaseDate, lastUpdate, description, appStoreUrl, sellerUrl }`. Also runnable as a CLI.

- **`src/tavily.js`** — Tavily web search with AI synthesis. Exports `tavilySearch(query, opts)` returning `{ answer, results[] }`. Reads `TAVILY_API_KEY` from `.claude/scripts/.env` or environment. Auto-detects topic (finance/news/general) and time range from query text.

- **`.claude/scripts/tavily-search.mjs`** — thin CLI wrapper around `src/tavily.js`, used internally by slash commands with `NODE_TLS_REJECT_UNAUTHORIZED=0`.

### IDE integrations

| IDE | Config file | Invocation |
|-----|-------------|------------|
| Claude Code | `.claude/commands/market.md` | `/market [niche]` |
| GitHub Copilot | `.github/prompts/market.prompt.md` | Copilot Chat → paperclip → `market` |
| OpenCode | `AGENTS.md` | `/market [niche]` |

The subagent definition in `.claude/agents/market-analyst.md` is used when the `/market` command spawns a specialized agent via Claude Code's agent system.

## Key formulas and rules

**Download estimate** (always label as estimate in reports):
```
downloads ≈ userRatingCount / 0.015
```

**Opportunity score per country:**
```
Score = (avg_DL_top10 / 1_000_000) × market_factor × (10 / (saturation + 1))

market_factor: us=1.0, jp=0.8, gb=0.7, au=0.7, ca=0.7, de=0.6, kr=0.5, fr=0.5, br=0.4, it=0.4, es=0.4, nl=0.4, se=0.4, mx=0.3, in=0.3
saturation   : number of apps with rating ≥ 4.5 in the top 10
```

**Pre-qualification score (autonomous mode Phase 0):**
```
score = (total_reviews / 1000) × (1 / avg_rating if avg_rating > 4.3 else 1.5) × (1 if nb_apps < 8 else 0.7)
```
Low reviews = unsaturated, low rating = user pain = opportunity, fewer apps = open space.

**Countries to always analyze:** us, fr, gb, de, jp, br, au, ca, kr, it, mx, es, in, nl, se

## Report output rules

- Save to `reports/YYYY-MM-DD-niche-slug.md` (create `reports/` if missing)
- App Store URLs: always `https://apps.apple.com/app/id{trackId}`
- Developer website: `sellerUrl` field from iTunes API — `N/D` if absent
- Never invent numbers — `N/D` for any missing data
- Always include current year in Tavily queries
- Max 3 parallel iTunes requests (Apple rate limits)
- If < 5 results for a country, try a broader keyword and note it in the report
