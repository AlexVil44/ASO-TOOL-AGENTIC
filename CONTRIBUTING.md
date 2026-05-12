# Contributing

Contributions are welcome — bug fixes, new IDE support, better scoring formulas, additional data sources.

## Before you start

Check [open issues](../../issues) to avoid duplicating work. For anything beyond a small fix, open an issue first to discuss the approach.

## Setup

```bash
git clone https://github.com/yourusername/aso-market-agent.git
cd aso-market-agent
cp .claude/scripts/.env.example .claude/scripts/.env
# add your TAVILY_API_KEY
```

No `npm install` needed — the project has no runtime dependencies.

## What to work on

Good first contributions:

- **New IDE support** — Cursor, Zed, Amp, Windsurf. Follow the pattern of existing adapters (`.claude/`, `.github/prompts/`, `AGENTS.md`). Each IDE needs its own config file; the core logic stays in `src/`.
- **Better scoring** — the opportunity formula (`reviews / 0.015`, market factors) is a starting point. If you have data to calibrate it better, open a PR with sources.
- **More countries** — the current list covers 15 markets. Additional storefronts (e.g. `sa`, `ae`, `tr`, `pl`) are straightforward to add.
- **Additional data sources** — free, no-auth APIs only. Document the source and rate limits in the PR.
- **Bug fixes** — iTunes API response shape changes, Tavily API updates, broken CLI output.

Not a good fit:

- Paid API integrations (Apple Search Ads, Sensor Tower, AppTweak, etc.) — keeps the tool free for everyone
- Heavy dependencies (frameworks, ORMs, bundlers) — the zero-install constraint is intentional
- Breaking changes to the `searchApps` / `lookupApps` / `tavilySearch` signatures without a major version bump

## Making changes

```bash
git checkout -b your-branch-name
```

Test your changes manually — there are no automated tests yet (see below).

For iTunes API changes, verify with a real search:

```bash
node src/itunes.js "meditation" us 5
```

For Tavily changes:

```bash
node .claude/scripts/tavily-search.mjs "test query 2026"
```

## Pull request guidelines

- One concern per PR — easier to review, easier to revert
- Describe what the change does and why, not just how
- If you add a new IDE adapter, include a short note in the PR on how you verified it works
- Keep `src/itunes.js` and `src/tavily.js` importable as standalone modules — don't add side effects at module level

## Tests

There is no test suite yet. If you want to add one, a minimal approach using Node's built-in `node:test` runner is preferred over introducing a test framework dependency.

## Code style

- ES modules (`import` / `export`), Node.js 18+
- No TypeScript — keep it accessible without a build step
- 4-space indentation
- Descriptive variable names over short ones
- Comments only when the why is non-obvious

## Reporting bugs

Open an issue with:

1. The command you ran
2. The output or error you got
3. Your Node.js version (`node --version`) and OS

---

Questions? Open an issue or reach out at [trykoda.app](https://trykoda.app).
