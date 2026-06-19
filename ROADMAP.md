# AINameGenius — Roadmap

_Dernière mise à jour : 19 juin 2026 — Sprint 3 — Stripe (packs de crédits) + gating crédits déployés_

## Statut de déploiement

| Service | Statut |
|---|---|
| API Vercel | ✅ Live |
| Supabase (13 tables) | ✅ Opérationnel |
| Auth JWT | ✅ Fonctionnel |
| GitHub CI/CD | ✅ Auto-deploy |
| OpenRouter LLM | ✅ Connecté |
| INPI Marques | ✅ Déployé |
| Frontend Landing Page | ✅ Déployé |
| Domaine ainamegenius.com | ✅ Configuré (IONOS + Vercel) |
| Pages auth /login /signup | ✅ Déployées |
| Page projet /projects/[id] | ✅ Déployée |
| Historique /projects | ✅ Déployé |
| Brand kit (palette/typo/tagline) | ✅ Déployé |
| Génération de logos (Gemini) | ✅ Déployé (clé configurée) |
| Stripe packs de crédits | ✅ Déployé (clés Stripe + migration 0005 à config) |

---

## Sprint 1 — Fonctionnel ✅ TERMINÉ

### Liens affiliés _(business model principal)_
- [x] **Namecheap** — `buildAffiliateLinks()` avec `AFFILIATE_NAMECHEAP_ID`
- [x] **GoDaddy** — paramètre `isc` + `AFFILIATE_GODADDY_ID`
- [x] **Hostinger** — paramètre `ref` + `AFFILIATE_HOSTINGER_ID`
- [ ] S'inscrire aux 3 programmes d'affiliation et ajouter les IDs dans Vercel
  - Namecheap : https://www.namecheap.com/affiliates/
  - GoDaddy : https://www.godaddy.com/affiliate-programs
  - Hostinger : https://www.hostinger.fr/affilies

### Disponibilité des domaines
- [x] RDAP `.com` et `.fr`
- [x] RDAP étendu à `.net`, `.org`, `.io`, `.co`, `.ai`, `.eu` (8 TLDs au total)
- [x] `DomainCheckSchema` mis à jour pour les 8 TLDs

### Marques (INPI)
- [x] Compte INPI créé — ROLE_API_MARQUES accordé
- [x] Format de réponse confirmé : **XML** avec syntaxe `[Mark=NOM]`
- [x] Auth confirmée : session JHipster + XSRF-TOKEN (pas OAuth2)
- [x] `lib/trademark/inpi.ts` réécrit — session-based auth, parsing XML (`fast-xml-parser`), niveaux de risque (clear / caution / conflict / incomplete)
- [x] `lib/trademark/check.ts` — orchestrateur
- [x] Route `/trademarks` connectée — persiste dans `trademark_results`
- [x] Migration `0003_trademark_unique.sql` appliquée dans Supabase
- [x] `fast-xml-parser` ajouté dans `package.json`
- [x] `INPI_USERNAME` et `INPI_PASSWORD` configurés dans Vercel

### Frontend — Landing Page
- [x] Page d'accueil déployée depuis Claude Design handoff (`app/page.tsx`)
- [x] Plus Jakarta Sans via `next/font/google`
- [x] Hero centré avec formulaire brief (textarea + industry select + count slider)
- [x] Génération animée : skeleton → names → trademark → domain → done
- [x] Cartes nom : score /100, statut marque INPI, grille 8 TLDs, menu "Acheter"
- [x] Boutons d'achat Namecheap / GoDaddy / Hostinger (liens affiliés intégrés)
- [x] Détail des scores (expandable)
- [x] Filtres : Tous / .com disponible / Faible risque
- [x] Section "Comment ça marche" + badges flottants animés
- [x] Corriger URL redirect Supabase Auth → `https://ainamegenius.com`
- [x] Connecter le formulaire à la vraie API (auth requise)

---

## Sprint 2 — Produit complet (semaine 3-4)

- [x] Pages auth (`/login`, `/signup`) — email/password + confirmation email
- [x] `AuthProvider` + `useAuth()` hook — session persistante
- [x] Connexion du formulaire landing → vraie API generate (quand connecté)
- [x] Domaine `ainamegenius.com` — IONOS A record + Vercel + Supabase redirect URL
- [x] Page projet `/projects/[id]` — résultats réels depuis Supabase (noms + scores + INPI + domaines)
- [x] Historique `/projects` — liste des projets sauvegardés
- [x] Composants de carte extraits dans `components/results.tsx` (partagés landing + projet)
- [x] Fix bug merge trademark (`tmJson.data.results` au lieu de `tmJson.data`)
- [x] Brand kit — palette, typographie (Google Fonts), tagline, ton de voix (OpenRouter)
- [x] Génération de logos — Google Gemini (`gemini-2.5-flash-image`), 3 concepts, stockés dans Supabase Storage
- [x] Route `/brand-kit` synchrone + `/logo` (régénérer) ; composant `BrandKit.tsx` ; section sur `/projects/[id]`
- [ ] **À faire (manuel)** : exécuter `migrations/0004_brand_assets.sql` dans Supabase + ajouter `GEMINI_API_KEY` dans Vercel
- [ ] Rapport PDF téléchargeable
- [ ] Page profil utilisateur / historique des projets

---

## Sprint 3 — Monétisation (semaine 5-6)

- [x] Modèle retenu : **packs de crédits** (achat unique, pas d'abonnement)
- [x] Stripe Checkout one-time (`/api/billing/checkout`, prix inline) + page `/pricing`
- [x] Webhook Stripe (vérif signature raw body, crédit du compte, idempotent)
- [x] Système de crédits : migration 0005 (trigger users + backfill + `spend_credits`/`grant_credits` atomiques)
- [x] Gating crédits : génération noms (1), brand kit (5), logos (3) — 402 + remboursement auto en cas d'échec
- [x] `GET /api/me` (solde) + badges crédits/Buy dans les navs + bannière succès d'achat
- [x] **Fix bug latent** : `public.users` non créé à l'inscription (FK projects cassée) — corrigé par le trigger
- [ ] **À faire (manuel)** : exécuter `migrations/0005_credits_and_users.sql` + `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` dans Vercel + endpoint webhook Stripe
- [ ] Packs : Starter 50/9€ · Pro 150/19€ · Business 500/49€ (modifiables dans `lib/billing/packs.ts`)

---

## Sprint 4 — Croissance (semaine 7-8)

- [ ] Pages résultats publiques (SEO)
- [ ] Vercel Analytics
- [ ] Tracking clics affiliés (table `events`)
- [ ] Blog / contenu SEO

---

## Variables d'environnement

| Variable | Statut | Obtenir depuis |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ Configuré | openrouter.ai |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Configuré | supabase.com |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Configuré | supabase.com |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configuré | supabase.com |
| `INPI_USERNAME` | ✅ Configuré | api-gateway.inpi.fr |
| `INPI_PASSWORD` | ✅ Configuré | api-gateway.inpi.fr |
| `AFFILIATE_NAMECHEAP_ID` | ⬜ En attente | namecheap.com/affiliates |
| `AFFILIATE_GODADDY_ID` | ⬜ En attente | godaddy.com/affiliate-programs |
| `AFFILIATE_HOSTINGER_ID` | ⬜ En attente | hostinger.fr/affilies |
| `STABILITY_API_KEY` | ⬜ Sprint 2 | platform.stability.ai |
| `STRIPE_SECRET_KEY` | ⬜ Sprint 3 | dashboard.stripe.com |
| `STRIPE_WEBHOOK_SECRET` | ⬜ Sprint 3 | dashboard.stripe.com |

---

## Architecture INPI (api-gateway.inpi.fr)

- **Endpoint** : `POST /services/apidiffusion/api/marques/search`
- **Auth** : Session JHipster + Cookie `XSRF-TOKEN` + header `X-XSRF-TOKEN`
- **Login** : `POST /api/authentication` avec `{ username, password, rememberMe: true }`
- **Format réponse** : XML (`application/xml`)
- **Syntaxe requête** : `{ "query": "[Mark=NOM]", "collections": ["FR", "EU"], ... }`
- **Champs retournés** : `Mark`, `MarkCurrentStatusCode`, `ApplicationNumber`, `ukey`

## Format de la réponse API `/domains`

```json
[{
  "name": "Lumevo", "tld": ".com", "status": "available",
  "buyLinks": {
    "namecheap": "https://www.namecheap.com/domains/registration/results/?domain=Lumevo.com",
    "godaddy": "https://www.godaddy.com/domainsearch/find?domainToCheck=Lumevo.com",
    "hostinger": "https://www.hostinger.fr/domaines?domain=Lumevo.com"
  }
}]
```

## Format de la réponse API `/trademarks`

```json
[{ "name": "Lumevo", "risk": "clear", "total": 0, "hits": [], "source": "inpi" }]
```
