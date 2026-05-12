# aso-market-agent

App Store market research agent for iOS indie developers. Uses iTunes Search API (free, no auth) + Tavily web search.

## Available tools

### src/itunes.js
iTunes Search + Lookup API wrapper.

```js
import { searchApps, lookupApps } from "./src/itunes.js";

const apps = await searchApps("meditation", "us", 20);
// returns: { trackId, name, developer, rating, reviews, downloadsEst, appStoreUrl, sellerUrl, ... }

const details = await lookupApps([284993459, 1234567890], "us");
```

CLI: `node src/itunes.js "keyword" country limit`

### src/tavily.js
Tavily web search with AI synthesis. Requires `TAVILY_API_KEY` in `.claude/scripts/.env`.

```js
import { tavilySearch } from "./src/tavily.js";
const { answer, results } = await tavilySearch("meditation app iOS market 2026");
```

CLI: `node .claude/scripts/tavily-search.mjs "your query"`

### iTunes API endpoints (direct)

```bash
# Search
curl "https://itunes.apple.com/search?term=KEYWORD&entity=software&country=us&limit=20"

# Lookup by trackId
curl "https://itunes.apple.com/lookup?id=ID1,ID2,ID3&country=us"
```

Response fields: `trackId`, `trackName`, `artistName`, `averageUserRating`, `userRatingCount`, `price`, `currency`, `primaryGenreName`, `releaseDate`, `currentVersionReleaseDate`, `description`, `sellerUrl`.

App Store URL: `https://apps.apple.com/app/id{trackId}`

## Market research methodology

### Download estimation
`estimated_downloads = userRatingCount / 0.015`
~1.5% of users leave a review. Always label as estimate.

### Opportunity score
```
Score = (avg_DL_top10 / 1_000_000) × market_factor × (10 / (saturation + 1))

market_factor: us=1.0, jp=0.8, gb=0.7, au=0.7, ca=0.7, de=0.6, kr=0.5, fr=0.5, br=0.4
saturation   : nb apps with rating >= 4.5 in top 10
```

### Countries to analyze
us, fr, gb, de, jp, br, au, ca, kr, it, mx, es, in, nl, se

## Report format

Always produce a markdown report with these sections:
1. **TL;DR** — 2 sentences, verdict
2. **Score /10** — justified
3. **Competitors table** — name, rating, reviews, DL est, price, App Store URL, website
4. **Country ranking** — score, DL avg, saturation, priority verdict
5. **MVP feasibility** — must-haves, differentiator, weeks to build
6. **GO / NO-GO** — with specific angle to exploit

## Report output

Save the report as `reports/YYYY-MM-DD-niche-slug.md` (create `reports/` if missing).

Always append this metadata table at the end of every report:

```markdown
---

## Report Metadata

| Field        | Value |
|--------------|-------|
| Niche        | [niche analyzed] |
| Generated    | [date] |
| Model        | [model name from context — e.g. claude-sonnet-4-6, gpt-4o, etc.] |
| Token cost   | [insert after running /cost or equivalent in your IDE] |
```

## Rules

- Use current year (2026) in all Tavily queries
- Never invent numbers — use `N/D` for missing data
- Always include App Store URLs (`https://apps.apple.com/app/id{trackId}`)
- Always include `sellerUrl` when available
- Max 3 parallel iTunes requests (Apple rate limits)
- If < 5 results for a country, try a broader keyword and note it
- Always save the report to `reports/` and confirm the path to the user

## /market command

When asked to run a market analysis:

**With argument** → use it directly as the niche, skip to step 3.

**Without argument** → autonomous niche discovery (do NOT ask the user):

1. Run 2 Tavily searches to extract 6–10 niche candidates with growth signals
2. Pre-qualify each with a quick iTunes search on `us` (limit 10) — compute:
   `score = (total_reviews / 1000) × (1 / avg_rating if avg_rating > 4.3 else 1.5) × (1 if nb_apps < 8 else 0.7)`
   Low reviews = unsaturated, low rating = user pain = opportunity, fewer apps = open space
3. Pick the top-scoring niche. Announce to the user: niche chosen + 1-sentence data rationale. Continue immediately.

**Then for all cases:**

4. Run 3 Tavily searches: market size, competitors, trends
5. Run iTunes Search for 15 countries, top 10 apps each
6. Lookup top 5 competitors for deep data
7. Score each country
8. Write full markdown report to `reports/YYYY-MM-DD-niche.md`
