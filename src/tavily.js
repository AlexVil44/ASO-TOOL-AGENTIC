// Wrapper Tavily API — recherche web avec synthèse IA
// Clé gratuite : https://tavily.com
// Placer TAVILY_API_KEY dans .claude/scripts/.env

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadApiKey() {
    const locations = [
        join(__dirname, "../.claude/scripts/.env"),
        join(__dirname, ".env"),
    ];
    for (const path of locations) {
        try {
            const content = readFileSync(path, "utf-8");
            const match = content.match(/TAVILY_API_KEY=(.+)/);
            if (match) return match[1].trim();
        } catch {
            // essai suivant
        }
    }
    return process.env.TAVILY_API_KEY || "";
}

const API_KEY = loadApiKey();

/**
 * Recherche web via Tavily avec synthèse IA.
 * @param {string} query
 * @param {{ maxResults?: number, topic?: string }} opts
 */
export async function tavilySearch(query, opts = {}) {
    if (!API_KEY) {
        throw new Error(
            "TAVILY_API_KEY manquante.\n" +
            "Copier .claude/scripts/.env.example → .claude/scripts/.env et ajouter votre clé."
        );
    }

    const body = {
        query,
        max_results: opts.maxResults ?? 5,
        search_depth: "basic",
        topic: opts.topic ?? detectTopic(query),
        include_answer: "advanced",
    };

    const timeRange = detectTimeRange(query);
    if (timeRange) body.time_range = timeRange;

    const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Tavily HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    return {
        answer: data.answer || null,
        results: (data.results || []).map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.content?.slice(0, 300) || "",
            score: r.score,
        })),
    };
}

function detectTopic(q) {
    const lower = q.toLowerCase();
    if (["bourse", "crypto", "trading", "stock", "market", "revenue"].some(k => lower.includes(k))) return "finance";
    if (["actualite", "news", "today", "recent", "announce"].some(k => lower.includes(k))) return "news";
    return "general";
}

function detectTimeRange(q) {
    const lower = q.toLowerCase();
    if (lower.includes("today") || lower.includes("aujourd'hui")) return "day";
    if (lower.includes("this week") || lower.includes("cette semaine")) return "week";
    if (["2025", "2026", "this year"].some(k => lower.includes(k))) return "year";
    return undefined;
}
