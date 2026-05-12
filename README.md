# aso-market-agent

Claude Code slash commands for App Store market research — no subscription, no SaaS, no bullshit.

Uses Apple's free iTunes Search API + Tavily web search to produce actionable market reports in minutes.

```
/market meditation app
```

→ Competitor list with App Store links, download estimates, country scores, GO / NO-GO verdict.

---

## Getting started

### Step 1 — Install Claude Code

If you don't have it yet:

```bash
npm install -g @anthropic-ai/claude-code
```

→ [claude.ai/code](https://claude.ai/code) for the full setup guide.

### Step 2 — Install Node.js

Check if you have it:

```bash
node --version
```

If not, download it from **[nodejs.org](https://nodejs.org)** — install the LTS version. Comes with npm.

### Step 3 — Install Python 3

Check if you have it:

```bash
python3 --version
```

- **Mac** : already installed on macOS 12+. If not: `brew install python3`
- **Windows** : download from [python.org](https://python.org)
- **Linux** : `sudo apt install python3`

### Step 4 — Get a free Tavily API key

1. Go to **[app.tavily.com](https://app.tavily.com)** and create a free account
2. Copy your API key (starts with `tvly-...`)
3. Free tier = 1000 requests/month, enough for dozens of market analyses

### Step 5 — Clone and configure

```bash
git clone https://github.com/yourusername/aso-market-agent.git
cd aso-market-agent

cp .claude/scripts/.env.example .claude/scripts/.env
```

Open `.claude/scripts/.env` and replace the placeholder with your key:

```
TAVILY_API_KEY=tvly-your-actual-key-here
```

### Step 6 — Open in Claude Code and run

```bash
claude .
```

Then type your first command:

```
/market
```

That's it. No `npm install`. No build step. No config file beyond the API key.

---

## Usage

```bash
/market                        # finds the 3 most promising niches of 2026, asks which to dig into
/market meditation app
/market budget personal finance
/market sleep tracker ios
/market language learning
```

### What the report includes

- **Opportunity score** (1-10) — market size × growth × inverse saturation
- **Competitor table** — App Store links, developer websites, download estimates, ratings, age
- **Country ranking** — 15 countries scored, which to target first and why
- **MVP feasibility** — what to build, what to skip, estimated weeks solo
- **GO / NO-GO verdict** with the angle to exploit

### Download estimates

All download numbers are estimates using the community formula:

```
estimated downloads ≈ review count / 0.015
```

~1.5% of users leave a review on average. Always labeled as estimates in the report.

---

## How it works

```
/market keyword
    │
    ├── Phase 0  (no keyword) → Tavily finds trending niches 2026
    ├── Phase 1  Tavily × 3  → market size, trends, competitors
    ├── Phase 2  iTunes Search API × 15 countries → top 10 apps + URLs
    ├── Phase 3  iTunes Lookup API → deep dive on top 5 competitors
    ├── Phase 4  Score each country
    └── Phase 5  Markdown report → GO / NO-GO
```

### Data sources

| Source | Auth | Cost |
|--------|------|------|
| [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) | None | Free |
| [iTunes Lookup API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) | None | Free |
| [Tavily](https://app.tavily.com) | API key | Free (1000 req/month) |

No Apple Search Ads credentials. No App Store Connect. No paid subscriptions.

---

## Use the services in your own code

`src/itunes.js` and `src/tavily.js` are standalone modules you can import:

```js
import { searchApps, lookupApps } from "./src/itunes.js";
import { tavilySearch } from "./src/tavily.js";

// Top 20 meditation apps in Japan
const apps = await searchApps("meditation", "jp", 20);
console.log(apps[0].name);          // Calm
console.log(apps[0].appStoreUrl);   // https://apps.apple.com/app/id...
console.log(apps[0].sellerUrl);     // https://calm.com
console.log(apps[0].downloadsEst);  // 12500000

// Detailed data on specific apps
const details = await lookupApps([284993459, 1234567890]);

// Web research
const { answer, results } = await tavilySearch("meditation app iOS market size 2026");
```

### CLI

```bash
# Search apps directly
node src/itunes.js "meditation" jp 10

# Tavily search
node .claude/scripts/tavily-search.mjs "sleep tracker iOS market 2026"
```

---

## Structure

```
aso-market-agent/
  .claude/
    agents/
      market-analyst.md       ← Claude agent specialized in App Store analysis
    commands/
      market.md               ← /market slash command
    scripts/
      tavily-search.mjs       ← Tavily CLI (used by the slash command)
      .env.example            ← copy this → .env, add your Tavily key
  src/
    itunes.js                 ← iTunes Search + Lookup API (importable)
    tavily.js                 ← Tavily search service (importable)
  .gitignore
  package.json
  README.md
```

---

## License

MIT — built by [Alexandre Villanueva](https://trykoda.app)
