# aso-market-agent

> App Store market research for iOS indie developers — no subscription, no SaaS required.

Produces actionable market reports using Apple's free iTunes Search API and Tavily web search: competitor analysis, download estimates, country opportunity scores, and a GO / NO-GO verdict — all from a single command.

Works with **Claude Code**, **GitHub Copilot**, and **OpenCode**.

```
/market meditation app
```

---

## What you get

A full markdown report saved to `reports/`, covering:

- **Opportunity score** (1–10) — market size × growth × inverse saturation
- **Competitor table** — ratings, review counts, estimated downloads, App Store links, developer websites
- **Country ranking** — 15 markets scored, priority order with justification
- **MVP feasibility** — must-have features, differentiator, estimated build time solo
- **GO / NO-GO verdict** with the specific angle to exploit
- **Report metadata** — date, model used, token cost hint

Without an argument, `/market` identifies the 3 most promising niches of the current year and asks which to dig into.

---

## Getting started

### Prerequisites

**Node.js 18+**

```bash
node --version   # check current version
```

Not installed? Download the LTS version from [nodejs.org](https://nodejs.org).

**Python 3**

```bash
python3 --version
```

- macOS 12+: pre-installed
- macOS older: `brew install python3`
- Windows: [python.org](https://python.org)
- Linux: `sudo apt install python3`

**An agentic IDE** (pick one)

| IDE | Install |
|-----|---------|
| Claude Code | `npm install -g @anthropic-ai/claude-code` — [full guide](https://claude.ai/code) |
| GitHub Copilot | VS Code extension — requires Copilot subscription |
| OpenCode | [opencode.ai](https://opencode.ai) |

### Setup

**1. Clone the repo**

```bash
git clone https://github.com/yourusername/aso-market-agent.git
cd aso-market-agent
```

**2. Get a free Tavily API key**

Create a free account at [app.tavily.com](https://app.tavily.com). The free tier includes 1000 requests/month — enough for dozens of full market analyses.

**3. Add your key**

```bash
cp .claude/scripts/.env.example .claude/scripts/.env
```

Edit `.claude/scripts/.env`:

```
TAVILY_API_KEY=tvly-your-key-here
```

**4. Open in your IDE and run**

```bash
claude .        # Claude Code
code .          # VS Code + Copilot
opencode .      # OpenCode
```

Then:

```
/market
```

No `npm install`. No build step. One config file.

---

## Usage

```
/market                       find the 3 most promising niches right now
/market meditation app
/market budget personal finance
/market sleep tracker ios
/market language learning kids
```

### Download estimates

All download figures use the community-established formula:

```
estimated downloads = review count / 0.015
```

Roughly 1.5% of users leave a review. All numbers in reports are clearly labeled as estimates.

### Opportunity score

```
Score = (avg_DL_top10 / 1_000_000) × market_factor × (10 / (saturation + 1))

market_factor  us=1.0  jp=0.8  gb=0.7  au=0.7  ca=0.7  de=0.6  fr=0.5 ...
saturation     number of apps with rating >= 4.5 in the top 10
```

---

## How it works

```
/market keyword
    │
    ├── Phase 0   no keyword → Tavily finds trending niches, proposes top 3
    ├── Phase 1   Tavily × 3 → market size, trends, revenue models
    ├── Phase 2a  iTunes Search API × 15 countries → top 10 apps + URLs per market
    ├── Phase 2b  iTunes Lookup → deep data on top 5 competitors
    ├── Phase 3   score each country
    └── Phase 4   write report to reports/YYYY-MM-DD-niche.md
```

### Data sources

| Source | Auth | Cost |
|--------|------|------|
| [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) | None | Free |
| [iTunes Lookup API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) | None | Free |
| [Tavily](https://app.tavily.com) | API key | Free tier: 1000 req/month |

No Apple Search Ads credentials. No App Store Connect. No paid SaaS.

---

## IDE support

| IDE | Invocation | Config |
|-----|-----------|--------|
| Claude Code | `/market keyword` | `.claude/commands/market.md` |
| GitHub Copilot | Copilot Chat → prompt picker → select `market` | `.github/prompts/market.prompt.md` |
| OpenCode | `/market` in agent chat | `AGENTS.md` |

**GitHub Copilot** — open Copilot Chat (`Ctrl+Shift+I` / `Cmd+Shift+I`), click the paperclip icon, select `market`. You'll be prompted to type the niche inline. Requires the GitHub Copilot extension v1.250+.

**OpenCode** — the repo's `AGENTS.md` is read automatically on open. Type `/market` and describe the niche.

---

## Use the services in your own code

`src/itunes.js` and `src/tavily.js` are standalone ES modules — import them in any Node.js 18+ project:

```js
import { searchApps, lookupApps } from "./src/itunes.js";
import { tavilySearch } from "./src/tavily.js";

// Top 20 meditation apps in Japan
const apps = await searchApps("meditation", "jp", 20);
console.log(apps[0].name);           // Calm
console.log(apps[0].rating);         // 4.8
console.log(apps[0].downloadsEst);   // 12500000
console.log(apps[0].appStoreUrl);    // https://apps.apple.com/app/id...
console.log(apps[0].sellerUrl);      // https://calm.com

// Deep data on specific apps by trackId
const details = await lookupApps([284993459, 1234567890]);

// Web research with AI synthesis
const { answer, results } = await tavilySearch("meditation app iOS market 2026");
console.log(answer);  // paragraph summary from Tavily
```

**CLI**

```bash
node src/itunes.js "meditation" jp 10
node .claude/scripts/tavily-search.mjs "sleep tracker iOS market 2026"
```

---

## Project structure

```
aso-market-agent/
  src/
    itunes.js                   iTunes Search + Lookup API (importable module + CLI)
    tavily.js                   Tavily search service (importable module)
  .claude/
    agents/
      market-analyst.md         Claude subagent specialized in App Store analysis
    commands/
      market.md                 /market slash command for Claude Code
    scripts/
      tavily-search.mjs         Tavily CLI wrapper (used by slash commands)
      .env.example              API key template — copy to .env
  .github/
    copilot-instructions.md     Copilot workspace context (formulas, rules, API details)
    prompts/
      market.prompt.md          /market prompt file for GitHub Copilot
  AGENTS.md                     OpenCode project instructions + /market command
  reports/                      Generated reports (gitignored — stays local)
  .gitignore
  package.json
  README.md
  CONTRIBUTING.md
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — built by [Alexandre Villanueva](https://trykoda.app)
