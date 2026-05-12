# aso-market-agent

Claude Code slash commands for App Store market research — no subscription, no SaaS.

Uses Apple's free iTunes Search API + Tavily web search to produce actionable market reports: opportunity scores, competitor analysis, download estimates, and country rankings.

## What you get

```
/market meditation app
```

Produces a full report with:
- **Opportunity score** (1-10) based on market size, saturation, growth
- **Competitor table** with App Store URLs, websites, download estimates, ratings
- **Country ranking** — which markets to target first and why
- **MVP feasibility** — what to build, what to skip, estimated weeks
- **GO / NO-GO verdict**

Without argument, `/market` finds the 3 most promising niches of 2026 and asks which to dig into.

## Setup

### 1. Requirements

- [Claude Code](https://claude.ai/code) installed
- Node.js 18+
- Python 3 (for curl pipelines)
- A free [Tavily](https://tavily.com) API key

### 2. Tavily API key

```bash
cp .claude/scripts/.env.example .claude/scripts/.env
# Edit .claude/scripts/.env and add your key:
# TAVILY_API_KEY=tvly-your-key-here
```

### 3. Use in Claude Code

Open this folder in Claude Code, then type:

```
/market fitness tracker
/market budget app
/market sleep tracker iOS
/market
```

## How it works

```
/market keyword
    │
    ├── Phase 0  (if no keyword) Tavily → find trending niches 2026
    ├── Phase 1  Tavily × 3 → market size, competitors, trends
    ├── Phase 2a iTunes Search API × 15 countries → top 10 apps per country
    ├── Phase 2b iTunes Lookup API → detailed data on top 5 competitors
    ├── Phase 3  Score each country (DL estimate × market factor / saturation)
    └── Phase 4  Markdown report → verdict GO / NO-GO
```

### Download estimation

`estimated downloads ≈ review count / 0.015`

Community-established rule: ~1.5% of users leave a review. Always shown as an estimate in reports.

### Opportunity score formula

```
Score = (avg_DL_top10 / 1_000_000) × market_factor × (10 / (saturation + 1))

market_factor: us=1.0, jp=0.8, gb=0.7, au=0.7, ca=0.7, de=0.6, fr=0.5 ...
saturation   : number of apps with rating ≥ 4.5 in top 10
```

## Data sources

| Source | Auth | Cost |
|--------|------|------|
| [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) | None | Free |
| [iTunes Lookup API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) | None | Free |
| [Tavily](https://tavily.com) | API key | Free tier (1000 req/month) |

No Apple Search Ads credentials needed. No App Store Connect. No paid subscriptions.

## src/ services

Reusable Node.js modules — use them independently:

```js
import { searchApps, lookupApps } from "./src/itunes.js";
import { tavilySearch } from "./src/tavily.js";

// Top 20 meditation apps in Japan
const apps = await searchApps("meditation", "jp", 20);
console.log(apps[0].appStoreUrl); // https://apps.apple.com/app/id...

// Detailed lookup
const details = await lookupApps([284993459, 1234567890]);

// Web research
const { answer, results } = await tavilySearch("meditation app market size 2026");
```

### CLI

```bash
# Search apps directly
node src/itunes.js "meditation" jp 10

# Tavily search
node .claude/scripts/tavily-search.mjs "sleep tracker iOS market 2026"
```

## Structure

```
aso-market-agent/
  .claude/
    agents/
      market-analyst.md   ← Claude agent specialized in App Store analysis
    commands/
      market.md           ← /market slash command
    scripts/
      tavily-search.mjs   ← CLI wrapper for Tavily
      .env.example        ← API key template
  src/
    itunes.js             ← iTunes Search + Lookup API service
    tavily.js             ← Tavily search service
  .gitignore
  package.json
  README.md
```

## License

MIT — built by [Alexandre Villanueva](https://trykoda.app)
