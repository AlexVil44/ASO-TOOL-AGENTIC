#!/usr/bin/env node
// iTunes Search + Lookup API — service sans auth, gratuit, officiel Apple
// Doc : https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/

const ITUNES_SEARCH = "https://itunes.apple.com/search";
const ITUNES_LOOKUP = "https://itunes.apple.com/lookup";

// Estimation téléchargements : règle communautaire ~1.5% des users laissent un avis
function estimateDownloads(reviewCount) {
    return reviewCount > 0 ? Math.round(reviewCount / 0.015) : 0;
}

function formatNumber(n) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
}

/**
 * Recherche des apps sur l'App Store pour un keyword et un pays donnés.
 * @param {string} keyword - Terme de recherche
 * @param {string} country - Code ISO pays (ex: "us", "fr", "jp")
 * @param {number} limit - Nombre de résultats (max 200)
 */
export async function searchApps(keyword, country = "us", limit = 20) {
    const url = new URL(ITUNES_SEARCH);
    url.searchParams.set("term", keyword);
    url.searchParams.set("entity", "software");
    url.searchParams.set("country", country);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("lang", "en_us");

    const res = await fetch(url.toString(), {
        headers: { "User-Agent": "aso-market-agent/1.0" },
        signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) throw new Error(`iTunes Search HTTP ${res.status} (${country})`);

    const data = await res.json();
    return (data.results || []).map(normalizeApp);
}

/**
 * Lookup détaillé sur une liste de trackIds.
 * @param {number[]} trackIds
 * @param {string} country
 */
export async function lookupApps(trackIds, country = "us") {
    const url = new URL(ITUNES_LOOKUP);
    url.searchParams.set("id", trackIds.join(","));
    url.searchParams.set("country", country);

    const res = await fetch(url.toString(), {
        headers: { "User-Agent": "aso-market-agent/1.0" },
        signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) throw new Error(`iTunes Lookup HTTP ${res.status}`);

    const data = await res.json();
    return (data.results || []).map(normalizeApp);
}

function normalizeApp(a) {
    const reviews = a.userRatingCount || 0;
    const trackId = a.trackId || 0;
    return {
        trackId,
        name: a.trackName || "",
        developer: a.artistName || "",
        rating: a.averageUserRating || 0,
        reviews,
        downloadsEst: estimateDownloads(reviews),
        downloadsEstFmt: formatNumber(estimateDownloads(reviews)),
        price: a.price || 0,
        currency: a.currency || "USD",
        genre: a.primaryGenreName || "",
        releaseDate: (a.releaseDate || "").slice(0, 10),
        lastUpdate: (a.currentVersionReleaseDate || "").slice(0, 10),
        description: (a.description || "").slice(0, 500),
        appStoreUrl: `https://apps.apple.com/app/id${trackId}`,
        sellerUrl: a.sellerUrl || null,
    };
}

// --- CLI standalone ---
// Usage : node src/itunes.js "meditation" us 10
if (process.argv[1] === new URL(import.meta.url).pathname) {
    const [keyword = "meditation", country = "us", limit = "10"] = process.argv.slice(2);
    const apps = await searchApps(keyword, country, Number(limit));

    console.log(`\n== iTunes Search: "${keyword}" — ${country.toUpperCase()} (${apps.length} résultats) ==\n`);
    for (const a of apps) {
        console.log(`${a.name.padEnd(40)} | ⭐${a.rating.toFixed(1)} | ${String(a.reviews).padStart(7)} avis | ~${a.downloadsEstFmt.padStart(6)} DL | ${a.price === 0 ? "Gratuit" : `${a.price}${a.currency}`}`);
        console.log(`  App Store : ${a.appStoreUrl}`);
        if (a.sellerUrl) console.log(`  Site web  : ${a.sellerUrl}`);
        console.log();
    }
}
