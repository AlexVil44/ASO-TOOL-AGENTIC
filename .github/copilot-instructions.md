# aso-market-agent — Copilot workspace instructions

This repo provides App Store market research tools for iOS indie developers.

## Available services

- `src/itunes.js` — iTunes Search + Lookup API (free, no auth). Functions: `searchApps(keyword, country, limit)`, `lookupApps(trackIds, country)`.
- `src/tavily.js` — Tavily web search with AI synthesis. Function: `tavilySearch(query, opts)`. Requires `TAVILY_API_KEY` in `.claude/scripts/.env`.

## Key rules

- Download estimates use `reviewCount / 0.015` — always label as estimates
- iTunes API: `https://itunes.apple.com/search` and `https://itunes.apple.com/lookup`
- App Store URLs: `https://apps.apple.com/app/id{trackId}`
- Developer website: `sellerUrl` field from iTunes API response
- Never invent data — use `N/D` when a field is missing
- Countries to analyze: us, fr, gb, de, jp, br, au, ca, kr, it, mx, es, in, nl, se

## Opportunity score formula

```
Score = (avg_DL_top10 / 1_000_000) × market_factor × (10 / (saturation + 1))

market_factor: us=1.0, jp=0.8, gb=0.7, au=0.7, ca=0.7, de=0.6, kr=0.5, fr=0.5, br=0.4
saturation   : number of apps with rating ≥ 4.5 in the top 10
```
