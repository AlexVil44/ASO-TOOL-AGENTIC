Analyse de marché App Store — niche : $ARGUMENTS

---

## Objectif

Identifier les opportunités de marché sur l'App Store iOS pour construire rapidement une app rentable. Produire un rapport actionnable avec scores, concurrents, URLs App Store + sites web, pays porteurs et estimation de téléchargements.

Utiliser la date du jour disponible dans le contexte (`currentDate`) dans toutes les recherches Tavily pour garantir des données fraîches.

---

## Phase 0 — Déterminer la niche

**Si `$ARGUMENTS` est vide** (commande lancée sans argument) :

Lancer deux recherches Tavily pour identifier les niches les plus porteuses :

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "App Store fastest growing app categories niches 2026 revenue opportunity indie developer"
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "iOS app market trends underserved niche low competition high downloads 2026"
```

Sélectionner les **3 niches les plus prometteuses** (croissance YoY > 15%, compétition modérée, faisable en solo). Présenter ces 3 options à l'utilisateur et demander laquelle approfondir.

**Si `$ARGUMENTS` est renseigné** : utiliser directement ce terme comme niche.

---

## Phase 1 — Recherche marché (Tavily)

Lancer 3 recherches avec l'année courante :

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "NICHE iOS app market size revenue growth 2026 statistics"
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "NICHE App Store best apps competitors indie success story 2025 2026"
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "NICHE app store keyword trends growing niche underserved opportunity 2026"
```

Extraire : taille du marché, croissance YoY, pain points, niches sous-exploitées, modèles de revenus dominants.

---

## Phase 2 — Données iTunes Search API (gratuit, sans auth)

### 2a. Scraping concurrents par pays

**Pays à analyser** : us, fr, gb, de, jp, br, au, ca, kr, it, mx, es, in, nl, se

```bash
node src/itunes.js "KEYWORD" COUNTRY 10
```

Ou via curl direct :

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

Collecter pour chaque pays :
- Top 10 apps avec rating, reviews, DL estimés, prix, URL App Store, site web
- Score saturation = nb apps avec rating ≥ 4.5

### 2b. Lookup détaillé des top 5 concurrents mondiaux

Récupérer les `trackId` des 5 apps avec le plus de reviews (toutes régions) puis :

```bash
curl -s "https://itunes.apple.com/lookup?id=ID1,ID2,ID3,ID4,ID5&country=us" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for a in data.get('results', []):
    tid = a.get('trackId', '')
    reviews = a.get('userRatingCount', 0)
    print('===')
    print(f\"App       : {a.get('trackName')}\")
    print(f\"Dev       : {a.get('artistName')}\")
    print(f\"Rating    : {a.get('averageUserRating', 0):.1f} ({reviews} avis)\")
    print(f\"Prix      : {a.get('price', 0)} {a.get('currency', '')}\")
    print(f\"Sortie    : {a.get('releaseDate','?')[:10]}\")
    print(f\"Maj       : {a.get('currentVersionReleaseDate','?')[:10]}\")
    print(f\"DL est    : {int(reviews/0.015):,}\")
    print(f\"App Store : https://apps.apple.com/app/id{tid}\")
    print(f\"Site web  : {a.get('sellerUrl', 'N/D')}\")
    print(f\"Desc      : {a.get('description','')[:300]}\")
"
```

---

## Phase 3 — Scoring des opportunités par pays

```
Score = (DL_moyen_top10 / 1_000_000) × facteur_marché × (10 / (saturation + 1))

facteur_marché : us=1.0, jp=0.8, gb=0.7, au=0.7, ca=0.7, de=0.6, kr=0.5, fr=0.5, br=0.4, it=0.4, es=0.4, nl=0.4, se=0.4, mx=0.3, in=0.3
saturation     : nombre d'apps avec rating ≥ 4.5 dans le top 10
```

Classer les pays du score le plus élevé au plus faible.

---

## Phase 4 — Rapport final

```markdown
# Rapport Marché App Store — [NICHE] — [DATE]

## TL;DR
[2 phrases : opportunité oui/non + angle d'attaque recommandé]

## Score Global d'Opportunité : X/10

---

## Marché & Tendances

### Taille & Croissance
[revenue annuel, nb apps dans la catégorie, croissance YoY — sources Tavily]

### Tendances 2026
- [Trend 1 — source]

### Modèles de revenus dominants
| Modèle      | Présence | Exemple       |
|-------------|----------|---------------|
| Freemium    | X%       | AppName       |
| One-time    | X%       | AppName       |
| Abonnement  | X%       | AppName       |

---

## Concurrents Principaux

| App | Rating | Avis | DL estimés* | Prix | Âge | App Store | Site web |
|-----|--------|------|-------------|------|-----|-----------|----------|
| [Nom](URL) | 4.8 | 45K | ~3M | 0€ | 3 ans | [lien](URL) | [lien](URL) |

*estimation communautaire : reviews / 0.015

### Analyse concurrentielle
- **Leader indétrônable** : [app + pourquoi]
- **Gap identifié** : [plainte récurrente, feature manquante]
- **Niche sous-couverte** : [angle d'entrée]

---

## Opportunités par Pays

| Pays | Score | DL moy. top10* | Saturation /10 | Verdict       |
|------|-------|----------------|----------------|---------------|
| 🇺🇸 US | 8.5 | ~2.3M        | 7              | ✅ Priorité 1  |
| 🇯🇵 JP | 7.2 | ~1.8M        | 4              | ✅ Priorité 2  |
| 🇬🇧 GB | 6.1 | ~900K        | 8              | ⚠️ Secondaire  |

### Pays à cibler en priorité
1. **[Pays]** — [raison]
2. **[Pays]** — [raison]

---

## Faisabilité MVP

### Features indispensables
- [Feature 1]
- [Feature 2]

### Différenciateur possible
- [Angle absent chez les concurrents]

### Estimation build
- Solo sans IA : X semaines
- Solo avec Claude Code : X semaines

### Modèle de revenu recommandé
[Modèle + justification]

---

## Score Final

| Critère                | Score /10 | Commentaire |
|------------------------|-----------|-------------|
| Taille marché          |           |             |
| Saturation concurrence |           |             |
| Facilité d'entrée      |           |             |
| Potentiel revenu       |           |             |
| Vitesse de build MVP   |           |             |
| **TOTAL**              | **/50**   |             |

---

## Recommandation

> **[GO / NO-GO / GO avec pivot]**
> [3 phrases : pourquoi, quel pays commencer, quel différenciateur exploiter]
```

---

## Règles d'exécution

- Inclure l'année courante dans toutes les queries Tavily
- Requêtes iTunes : max 3 pays en parallèle (rate limiting Apple)
- Si < 5 résultats pour un pays, essayer un keyword plus générique et le noter
- URLs App Store : toujours construire `https://apps.apple.com/app/idTRACKID`
- Site web : champ `sellerUrl` de l'API iTunes — `N/D` si absent
- DL : toujours préciser que c'est une estimation (`reviews / 0.015`)
- Données manquantes → `N/D`, jamais inventer
