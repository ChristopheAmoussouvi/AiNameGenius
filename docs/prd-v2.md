# AINameGenius — PRD MVP & Architecture Technique — V2

**Date**: 2026-06-16  
**Status**: Version de travail consolidée  
**Source**: Google Drive — "2026-06-16 - AINameGenius - PRD MVP & Architecture - V2 (améliorée)"

---

## 0. Ce qui change par rapport à la V1

1. **Domaines** : abandon de Namecheap/OVH payants → RDAP (gratuit, officiel). Les registrars restent pour l'achat (affiliation) uniquement.
2. **Anti-hallucination** : l'IA ne doit JAMAIS affirmer une disponibilité de domaine ou de marque. Statuts via API factuelles uniquement.
3. **Statuts Vert/Orange/Rouge** : règle déterministe et auditable.
4. **Schéma** : horodatages, enums, RLS Supabase, index, ledger crédits, table events.
5. **API** : modèle asynchrone par jobs, clés d'idempotence, auth, rate limiting.
6. **Coûts** : garde-fous budgétaires par rapport (cap, cache, déduplication) → KPI `< 1 €`.
7. **Conformité** : RGPD + cadrage INPI/EUIPO + journalisation disclaimer.
8. **Périmètre 7 jours** : concierge d'abord, automatisation ensuite.

---

## 1. Objectif & périmètre MVP

Livrer rapidement un outil vendable qui transforme un brief en :
- (a) shortlist de noms brandables
- (b) statut domaine vérifié
- (c) pré-check marque indicatif
- (d) rapport PDF daté

**Stratégie en 2 temps :**
- **V0 "Concierge"** (J1–J3) : formulaire + génération IA + checks domaines RDAP + rapport semi-manuel. Objectif : valider la valeur et premiers clients payants.
- **V1 "Automatisée"** (J4–J7) : pipeline complet, PDF auto, paiement, affiliation domaine, logo sur favoris.

**Hors périmètre MVP** : dépôt de marque réel, surveillance continue, multi-utilisateur/équipes, internationalisation au-delà de FR/EN, génération vidéo.

---

## 2. Parcours utilisateur & monétisation

Brief → génération → shortlist scorée → **Acheter le domaine** (lien affiliation, par carte dispo) → **Générer un logo** (favoris uniquement) → Télécharger mini brand kit → Upsell rapport premium.

**Règles produit :**
- "Acheter le domaine" : apparaît sur chaque carte avec au moins un domaine clé disponible.
- "Générer un logo" : uniquement sur les favoris (maîtrise du coût API image).
- Brand kit + rapport premium = points de monétisation à forte marge.

---

## 3. Fonctionnalités prioritaires

- **Brief** : secteur, marché/pays, langue (FR/EN), ton, longueur cible, racines souhaitées/interdites, TLDs, classes de Nice (optionnel mais recommandé).
- **Génération** : 80–150 noms en familles créatives, 1 appel LLM JSON strict.
- **Nettoyage déterministe** (code, pas IA) : longueur, prononçabilité, doublons, mots descriptifs, termes interdits.
- **Domaines** : `.com` et `.fr` obligatoires ; `.ai .io .co .app .eu` en option. Via RDAP.
- **Marques** : exact match, variantes sans accents, proximité orthographique/phonétique, filtré par classes de Nice.
- **Scoring explicable** : voir §6.
- **Rapport** : top 10, tableau domaines, tableau risques marque, recommandations, disclaimer.

---

## 4. Vérification des domaines

**Principe** : disponibilité = fait, jamais une opinion IA. Source unique = RDAP.

- `.com`/gTLD : RDAP (404 = potentiellement disponible ; objet renvoyé = enregistré).
- `.fr` : RDAP AFNIC (`rdap.nic.fr`). *(à valider : endpoint exact et rate limits)*
- 3 cas à afficher : `available`, `taken`, `premium / unknown`.
- Achat : lien d'affiliation registrar (UTM trackés) → table `affiliate_links`. Pas de revente API dans le MVP.
- **Robustesse** : timeout court, retries limités, cache (domaine, tld) TTL 24h.

---

## 5. Pré-check marques

**Sources** :
- INPI (France) : données ouvertes / API registre national *(à valider : data.inpi.fr)*
- EUIPO (UE) : API TMview *(à valider : conditions + clé)*
- WIPO : pas d'API publique fiable → optionnel/manuel, ne pas scraper.

**Logique de risque (déterministe)** :
- Exact match dans une classe pertinente → 🔴 Rouge (`conflict`)
- Similarité forte ortho/phonétique dans une classe pertinente → 🟠 Orange (`caution`)
- Aucune collision évidente dans les sources + classes pertinentes → 🟢 Vert (`clear`)
- Source indispo / données incomplètes / classes non renseignées → ⚪ À investiguer (`incomplete`) — **jamais Vert par défaut**

**Cadre juridique NON NÉGOCIABLE** :
- Le produit fournit un pré-check indicatif, pas un avis juridique.
- Microcopy : *"AINameGenius provides pre-checks, not legal advice."*
- Bannir : *"legally safe"*, *"trademark guaranteed"*.
- Journaliser l'acceptation du disclaimer (`disclaimer_accepted` + horodatage + version).

---

## 6. Scoring explicable

**A) Scores "faits" (déterministes, calculés depuis API)** :
- `domain_score` : disponibilité des domaines clés (`.com`/`.fr` pondérés plus fort).
- `trademark_score` : risque marque calculé depuis §5.

**B) Scores "jugement IA" (subjectifs, fournis par le LLM)** :
- `brandability`, `linguistic_score` (mémorisation, différenciation, prononciation FR/EN, potentiel logo, risque descriptif, potentiel international).

**Score total** (exemple de pondération, à calibrer) :
```
total = 0.35·brandability + 0.20·linguistic + 0.25·domain + 0.20·trademark
```
*(Implémentation actuelle : 0.30·brand + 0.15·linguistic + 0.30·domain + 0.25·trademark)*

**Règle d'or** : l'IA ne voit PAS les résultats des checks au moment où elle juge la brandabilité, pour éviter qu'elle "rationalise" un nom déjà pris. Les scores faits sont injectés après.

---

## 7. Stack technique

| Couche | Choix |
|--------|-------|
| Frontend | Next.js App Router + Tailwind + shadcn/ui, Vercel |
| Backend | Next.js Route Handlers (jobs longs déportés) |
| Base | Supabase (PostgreSQL + Auth + Storage + RLS) |
| IA texte | OpenAI `gpt-4.1-mini`, JSON strict |
| IA image | GPT Image (logo, sur favoris uniquement) |
| Domaines | RDAP (gratuit) |
| Marques | INPI / EUIPO |
| PDF | Playwright ou service managé |
| Automation | n8n (emails, relances, CRM) |

---

## 8. Schéma de données

**Enums** : `domain_status` (available/taken/premium/unknown), `trademark_status` (clear/caution/conflict/incomplete), `job_status` (queued/running/done/error), `plan` (free/pro/premium).

**Tables principales** : `users`, `projects`, `name_candidates`, `domain_results`, `trademark_results`, `scores`, `reports`, `generation_jobs`, `affiliate_links`, `logo_jobs`, `brand_kits`, `credits_ledger`, `events`.

---

## 9. API interne (asynchrone, idempotente)

| Route | Description |
|-------|-------------|
| `POST /api/projects` | Crée un projet (exige `disclaimer_accepted`) |
| `POST /api/projects/:id/generate` | Job génération + scoring |
| `POST /api/projects/:id/domains` | Checks domaines RDAP en lot |
| `POST /api/projects/:id/trademarks` | Job pré-check marques |
| `POST /api/projects/:id/logo` | Job logo (favoris + crédits) |
| `POST /api/projects/:id/report` | Job PDF |
| `GET /api/jobs/:id` | Statut d'un job |
| `GET /api/projects/:id` | Projet + candidats + résultats |

---

## 12. Contrôle des coûts

- Cap budgétaire par rapport : **< 1 €** (1 appel génération + 1 appel scoring en lot, RDAP gratuit).
- Cache domaines TTL 24h, marques TTL plus long.
- Images : favoris uniquement + débit crédits avant appel.
- Quota générations/jour par plan.

---

## 13. Pricing

| Plan | Contenu |
|------|---------|
| Free | 1 brief, shortlist limitée, rapport filigrané, pas de logo |
| Pro | Rapport PDF complet, plus de noms/TLDs, 1 logo inclus |
| Premium | Rapport premium + mini brand kit (logo variants, palette, avatar social, export) |
| Affiliation | Revenu sur achat domaine |

---

## 16. Roadmap

- **Phase 0** (J1–J3) — Concierge : formulaire + génération + RDAP + rapport semi-manuel
- **Phase 1** (J4–J7) — MVP automatisé : pipeline complet, PDF auto, paiement, affiliation, logo
- **Phase 2** — Monétisation : brand kit, rapport premium, abonnements, n8n
- **Phase 3** — Scale : EUIPO/INPI robustes, phonétique avancée, multi-pays, surveillance marque

---

## 18. Questions ouvertes

1. Confirmer endpoints et quotas RDAP (.com et AFNIC .fr).
2. Confirmer accès API INPI et EUIPO (clé, quotas, licence).
3. Choix LLM texte : OpenAI vs Mistral (coût/qualité FR).
4. PSP de paiement (Stripe ?) et modèle (ponctuel vs abonnement).
5. Pondérations finales du score total à calibrer sur des exemples réels.
