Analyse de marché App Store — niche : $ARGUMENTS

---

## Objectif

Identifier les opportunités de marché sur l'App Store iOS pour construire rapidement une app rentable. Produire un rapport actionnable avec scores, concurrents, URLs App Store + sites web, pays porteurs et estimation de téléchargements.

Utiliser la date du jour disponible dans le contexte (`currentDate`) dans toutes les recherches Tavily pour garantir des données fraîches.

---

## Phase 0 — Déterminer la niche

**Si `$ARGUMENTS` est renseigné** : utiliser directement ce terme, passer à la Phase 1.

**Si `$ARGUMENTS` est vide** — mode découverte autonome :

L'agent détermine lui-même la meilleure niche à analyser sans demander à l'utilisateur. Processus en 3 étapes :

### 0a. Identifier les candidats (Tavily)

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "App Store fastest growing app categories 2026 revenue indie developer low competition"
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "iOS app niche underserved market opportunity high downloads 2026 solo developer buildable"
```

Extraire une liste de 6 à 10 niches candidates avec pour chacune : signal de croissance, niveau de compétition estimé, faisabilité solo.

### 0b. Pré-qualifier avec iTunes (données réelles)

Pour chacune des niches candidates, lancer une recherche iTunes sur `us` uniquement :

```bash
curl -s "https://itunes.apple.com/search?term=NICHE&entity=software&country=us&limit=10" | python3 -c "
import json, sys
data = json.load(sys.stdin)
apps = data.get('results', [])
reviews = [a.get('userRatingCount', 0) for a in apps]
ratings = [a.get('averageUserRating', 0) for a in apps if a.get('averageUserRating')]
total_reviews = sum(reviews)
avg_rating = sum(ratings)/len(ratings) if ratings else 0
top_dl = int(max(reviews)/0.015) if reviews else 0
print(f'results={len(apps)} total_reviews={total_reviews} avg_rating={avg_rating:.1f} top_dl_est={top_dl}')
"
```

Calculer pour chaque candidat un **score de présélection** :
```
score = (total_reviews / 1000) × (1 / avg_rating si avg_rating > 4.3 else 1.5) × (1 si nb_apps < 8 else 0.7)
```
— peu de reviews = marché peu saturé, rating moyen bas = insatisfaction = opportunité, moins de 8 apps dans le top 10 = espace disponible.

### 0c. Sélectionner et annoncer

Choisir la niche avec le meilleur score de présélection. Annoncer à l'utilisateur :

```
Niche retenue : [NICHE]
Raison : [1 phrase basée sur les données — ex: "top 10 totalise seulement 12K reviews, rating moyen 3.8, 6 apps dans les résultats = marché peu saturé avec insatisfaction utilisateurs"]
Lancement de l'analyse complète...
```

Continuer directement avec la Phase 1 sur cette niche — sans attendre de confirmation.

---

## Phase 1 — Recherche marché (Tavily)

Lancer 4 recherches avec l'année courante :

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "NICHE iOS app market size revenue growth 2026 statistics"
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "NICHE App Store best apps competitors indie success story 2025 2026"
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "NICHE app store keyword trends growing niche underserved opportunity 2026"
NODE_TLS_REJECT_UNAUTHORIZED=0 node .claude/scripts/tavily-search.mjs "App Store keywords search volume NICHE category 2026 ASO optimization"
```

Extraire : taille du marché, croissance YoY, pain points, niches sous-exploitées, modèles de revenus dominants, **keywords les plus recherchés et leur volume de recherche estimé**.

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

## Stratégie ASO & Keywords

### Keywords prioritaires
| Keyword | Volume* | Difficulté | Compétiteurs | Recommandation |
|---------|---------|-----------|--------------|----------------|
| Primary keyword | XXK/mois | Haute | 50+ | Intégrer dans title |
| Secondary | XXK/mois | Moyenne | 20+ | Intégrer dans subtitle |
| Long-tail | XXK/mois | Basse | <10 | Intégrer dans description |

*Volume estimé recherches mensuelles App Store

### Stratégie de titre & subtitle
- **Title** (30 chars max) : `[Primary Keyword] - [Differentiator]`
- **Subtitle** (30 chars max) : `[Secondary Keyword] + [Use Case]`
- **Mots clés** (keyword field, 100 chars) : `keyword1, keyword2, keyword3, keyword4, keyword5`

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

---

## Stratégie Marketing Indie Dev

### Canaux recommandés

| Canal | Coût mensuel | Effort | ROI indie | Timing |
|-------|-------------|--------|-----------|--------|
| Apple Search Ads (ASA) | $50–200 | Faible | ★★★★★ | J0 (lancement) |
| Reddit (subreddits niche) | Gratuit | Moyen | ★★★★☆ | T-8 semaines |
| Twitter/X #buildinpublic | Gratuit | Élevé | ★★★☆☆ | T-12 semaines |
| TikTok / Reels | Gratuit | Élevé | ★★★★☆ | T-4 semaines |
| Product Hunt | Gratuit | Moyen | ★★★☆☆ | J0 |
| Micro-influenceurs niche | $0–100 | Moyen | ★★★★☆ | T-2 semaines |
| Newsletter sponsoring | $50–300 | Faible | ★★★★☆ | J+30 |

### Budget bootstrapé recommandé

| Phase | Budget | Actions prioritaires |
|-------|--------|---------------------|
| Pré-lancement (8 semaines) | $0–100 | Landing page waitlist, build in public, teaser screenshots |
| Lancement (J0 – J7) | $50–300 | Product Hunt, Apple Search Ads $10/jour, post Reddit |
| Post-lancement (3 mois) | $100–400/mois | ASA continu, 2-3 micro-influenceurs niche, review farming |

### Apple Search Ads — Priorité #1 indie
Canal à ROI le plus prévisible pour une app iOS. Budget minimal viable : **$3-5/jour**.
- Cibler les **keywords long-tail** (<1000 MAU), CPT cible $0.30–0.80
- Bidder sur son propre nom dès J0 (brand defense)
- Bidder sur les noms des concurrents directs (légal et efficace)
- Activer les **Custom Product Pages** pour des accroches par persona

### Séquence de lancement recommandée

1. **T-12 à T-8** : Build in public Twitter/X, screenshots teaser, landing page
2. **T-8 à T-4** : Waitlist, posts Reddit niche, premier short video viral
3. **T-2** : Preview Product Hunt, contact 3-5 micro-influenceurs
4. **J0** : Product Hunt launch + ASA $10/jour + post Reddit + email waitlist
5. **J+7** : Push notif demande d'avis, analyse ASA, optimisation keywords
6. **J+30** : Analyse rétention J1/J7/J30, pivot ou scale

---

## Métadonnées

| Champ        | Valeur |
|--------------|--------|
| Niche        | [NICHE] |
| Généré le    | [DATE_JOUR] |
| Modèle       | [NOM_MODELE — lire depuis le contexte système : "You are powered by the model named..."] |
| Coût tokens  | ⚡ Lancer `/cost` dans Claude Code pour voir le coût de cette session |
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
- **Keywords** : toujours extraire depuis Tavily (recherche trends + volume), classer par volume et difficulté, fournir des templates de title/subtitle prêts à l'emploi
- **Sauvegarder le rapport** : écrire le fichier dans `reports/YYYY-MM-DD-niche-slug.md` (créer le dossier `reports/` s'il n'existe pas) et confirmer le chemin à l'utilisateur
