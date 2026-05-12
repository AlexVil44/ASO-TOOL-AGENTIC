#!/usr/bin/env node
// CLI Tavily — usage interne aux slash commands Claude Code
// Usage : node .claude/scripts/tavily-search.mjs "votre recherche"

import { tavilySearch } from "../../src/tavily.js";

const query = process.argv.slice(2).join(" ");

if (!query) {
    console.error("Usage: node .claude/scripts/tavily-search.mjs <recherche>");
    process.exit(1);
}

const startTime = Date.now();

try {
    const { answer, results } = await tavilySearch(query);
    const elapsed = Date.now() - startTime;

    console.log("=".repeat(70));
    console.log(`RECHERCHE TAVILY : ${query}`);
    console.log(`Temps: ${elapsed}ms`);
    console.log("=".repeat(70));

    if (answer) {
        console.log("\n## Synthese IA\n");
        console.log(answer);
    }

    if (results.length > 0) {
        console.log("\n## Sources\n");
        results.forEach((r, i) => {
            let domain = "";
            try { domain = new URL(r.url).hostname.replace("www.", ""); } catch { domain = r.url; }
            console.log(`${i + 1}. **${r.title}** (${domain})`);
            console.log(`   ${r.snippet}`);
            console.log(`   URL: ${r.url}`);
            console.log(`   Score: ${r.score}`);
            console.log();
        });
    }

    console.log("=".repeat(70));
    console.log(`Resultats: ${results.length} | Reponse IA: ${answer ? "Oui" : "Non"}`);
    console.log("=".repeat(70));
} catch (err) {
    console.error(`Erreur: ${err.message}`);
    process.exit(1);
}
