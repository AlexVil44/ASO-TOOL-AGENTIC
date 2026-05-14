---
mode: agent
description: App Store market research — competitor analysis, download estimates, country scores, GO/NO-GO verdict
tools:
  - terminal
  - search
---

# App Store Market Research

Analyze the App Store market for: **${input:niche:Niche to research — leave blank for autonomous discovery}**

Use today's date in all web searches to get fresh 2026 data.

**If the niche field was left blank** — autonomous mode: do NOT ask the user. Instead:
1. Run 2 Tavily searches to extract 6–10 niche candidates with growth signals
2. Pre-qualify each with iTunes Search on `us` (limit 10) — score: `(total_reviews / 1000) × (low_rating_bonus) × (low_count_bonus)`
3. Pick the highest-scoring niche, announce it with a 1-sentence data rationale, continue immediately.

## Step 1 — Web research (run in terminal)

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "${input:niche} iOS app market size revenue 2026"
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "${input:niche} App Store competitors indie success 2025 2026"
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "${input:niche} app store underserved niche opportunity 2026"
```

## Step 2 — Competitor data per country (run in terminal)

For each country in: us, fr, gb, de, jp, au, ca, kr, it, br

```bash
curl -s "https://itunes.apple.com/search?term=KEYWORD&entity=software&country=COUNTRY&limit=20&lang=en_us" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for a in data.get('results', [])[:10]:
    reviews = a.get('userRatingCount', 0)
    dl = int(reviews / 0.015) if reviews > 0 else 0
    tid = a.get('trackId', '')
    print(f\"NAME: {a.get('trackName','?')[:45]}\")
    print(f\"RATING: {a.get('averageUserRating',0):.1f} | REVIEWS: {reviews} | DL_EST: {dl:,} | PRICE: {a.get('price',0)}\")
    print(f\"APP_STORE: https://apps.apple.com/app/id{tid}\")
    print(f\"SITE_WEB: {a.get('sellerUrl','N/D')}\")
    print('---')
"
```

## Step 3 — Deep dive on top 5 competitors

Get the top 5 apps by review count, then lookup:

```bash
curl -s "https://itunes.apple.com/lookup?id=ID1,ID2,ID3,ID4,ID5&country=us" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for a in data.get('results', []):
    tid = a.get('trackId', '')
    reviews = a.get('userRatingCount', 0)
    print(f\"App: {a.get('trackName')} | Rating: {a.get('averageUserRating',0):.1f} | DL est: {int(reviews/0.015):,}\")
    print(f\"Released: {a.get('releaseDate','?')[:10]} | Updated: {a.get('currentVersionReleaseDate','?')[:10]}\")
    print(f\"App Store: https://apps.apple.com/app/id{tid}\")
    print(f\"Website: {a.get('sellerUrl','N/D')}\")
    print(f\"Desc: {a.get('description','')[:200]}\")
    print('---')
"
```

## Step 4 — Produce the report

Output a markdown report with:

- **TL;DR** (2 sentences)
- **Score global /10**
- **Competitors table** — name, rating, reviews, estimated downloads*, price, App Store link, website
- **Country ranking table** — score, avg DL top10, saturation, verdict (✅ Priority / ⚠️ Secondary)
- **MVP feasibility** — must-have features, differentiator, estimated weeks solo
- **GO / NO-GO verdict** with the angle to exploit
- **Indie Dev Marketing Strategy** section:
  - Recommended channels table (Apple Search Ads, Reddit, Twitter/X, TikTok, Product Hunt, micro-influencers, newsletters) with monthly cost, effort level, estimated ROI, and timing
  - Bootstrapped budget table: pre-launch / launch (J0–J7) / post-launch (3 months)
  - Apple Search Ads tactics: long-tail keywords, brand bidding, competitor conquest, Custom Product Pages
  - Recommended launch sequence: T-12w to J+30

*downloads estimated as `reviews / 0.015` — community formula, ~1.5% of users leave a review

---

## Output file

Save the report as `reports/YYYY-MM-DD-${input:niche}.md` (create `reports/` folder if missing). Confirm the file path at the end.

Append this metadata block at the bottom of the report:

```markdown
---

## Report Metadata

| Field      | Value |
|------------|-------|
| Niche      | ${input:niche} |
| Generated  | [today's date] |
| Model      | [Copilot model in use — e.g. gpt-4o, claude-3.5-sonnet] |
| Token cost | [not available in Copilot — check your GitHub billing dashboard] |
```
