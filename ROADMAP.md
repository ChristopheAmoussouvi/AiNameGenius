# AINameGenius — Roadmap

_Dernière mise à jour : 18 juin 2026 — auto-mis à jour à chaque commit_

## Statut de déploiement

| Service | Statut |
|---|---|
| API Vercel | ✅ Live |
| Supabase (13 tables) | ✅ Opérationnel |
| Auth JWT | ✅ Fonctionnel |
| GitHub CI/CD | ✅ Auto-deploy |
| OpenRouter LLM | ✅ Connecté |

---

## Sprint 1 — Rendre le site fonctionnel (semaine 1-2)

### Liens affiliés _(business model principal)_
- [x] **Namecheap** — `buildAffiliateLinks()` avec `AFFILIATE_NAMECHEAP_ID`
- [x] **GoDaddy** — paramètre `isc` + `AFFILIATE_GODADDY_ID`
- [x] **Hostinger** — paramètre `ref` + `AFFILIATE_HOSTINGER_ID`
- [ ] S'inscrire aux 3 programmes d'affiliation
  - Namecheap : https://www.namecheap.com/affiliates/
  - GoDaddy : https://www.godaddy.com/affiliate-programs
  - Hostinger : https://www.hostinger.fr/affilies
- [ ] Ajouter `AFFILIATE_GODADDY_ID` et `AFFILIATE_HOSTINGER_ID` dans Vercel env vars

### Disponibilité des domaines
- [x] RDAP `.com` et `.fr`
- [x] RDAP étendu à `.net`, `.org`, `.io`, `.co`, `.ai`, `.eu` (8 TLDs au total)
- [x] `DomainCheckSchema` mis à jour pour accepter les 8 TLDs

### Marques (INPI)
- [x] Compte INPI créé — ROLE_API_MARQUES accordé
- [x] Format de réponse confirmé : **XML** avec syntaxe `[Mark=NOM]`
- [x] Auth confirmée : session JHipster + XSRF-TOKEN (pas OAuth2)
- [x] `lib/trademark/inpi.ts` réécrit — session-based auth, parsing XML (`fast-xml-parser`), niveaux de risque (clear / caution / conflict / incomplete)
- [x] `lib/trademark/check.ts` — orchestrateur
- [x] Route `/trademarks` connectée — persiste dans `trademark_results`
- [x] Migration `0003_trademark_unique.sql` — contrainte unique pour upsert
- [x] `fast-xml-parser` ajouté dans `package.json`
- [ ] **ACTION CRITIQUE** : Ajouter `INPI_USERNAME` et `INPI_PASSWORD` dans Vercel env vars (Settings → Environment Variables)
- [ ] **ACTION CRITIQUE** : Appliquer la migration `0003` dans le SQL Editor Supabase

### Frontend
- [ ] Page d'accueil + formulaire brief
- [ ] Page de résultats : noms + domaines + boutons "Acheter"
- [ ] Corriger URL redirect Supabase Auth (actuellement `localhost:3000` → URL Vercel)

---

## Sprint 2 — Produit complet (semaine 3-4)

- [ ] Génération de logos (Stability AI ou Replicate)
- [ ] Brand kit (couleurs, polices, tagline)
- [ ] Rapport PDF téléchargeable
- [ ] Page profil utilisateur

---

## Sprint 3 — Monétisation (semaine 5-6)

- [ ] Stripe Checkout + webhooks
- [ ] Plans Free / Pro / Business
- [ ] Système de crédits complet

---

## Sprint 4 — Croissance (semaine 7-8)

- [ ] Pages résultats publiques (SEO)
- [ ] Analytics (Vercel Analytics)
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
| `INPI_USERNAME` | ❌ À ajouter | api-gateway.inpi.fr (ton email INPI) |
| `INPI_PASSWORD` | ❌ À ajouter | api-gateway.inpi.fr (ton mot de passe INPI) |
| `AFFILIATE_NAMECHEAP_ID` | ❌ À ajouter | namecheap.com/affiliates |
| `AFFILIATE_GODADDY_ID` | ❌ À ajouter | godaddy.com/affiliate-programs |
| `AFFILIATE_HOSTINGER_ID` | ❌ À ajouter | hostinger.fr/affilies |
| `STABILITY_API_KEY` | ❌ Sprint 2 | platform.stability.ai |
| `STRIPE_SECRET_KEY` | ❌ Sprint 3 | dashboard.stripe.com |
| `STRIPE_WEBHOOK_SECRET` | ❌ Sprint 3 | dashboard.stripe.com |

---

## Format de la réponse API `/domains`

```json
[
  {
    "name": "Lumevo",
    "tld": ".com",
    "status": "available",
    "buyLinks": {
      "namecheap": "https://www.namecheap.com/domains/registration/results/?domain=Lumevo.com",
      "godaddy": "https://www.godaddy.com/domainsearch/find?domainToCheck=Lumevo.com",
      "hostinger": "https://www.hostinger.fr/domaines?domain=Lumevo.com"
    }
  }
]
```

## Format de la réponse API `/trademarks`

```json
[
  {
    "name": "Lumevo",
    "risk": "clear",
    "total": 0,
    "hits": [],
    "source": "inpi"
  }
]
```

## Architecture INPI (api-gateway.inpi.fr)

- **Endpoint** : `POST /services/apidiffusion/api/marques/search`
- **Auth** : Session JHipster + Cookie `XSRF-TOKEN` + header `X-XSRF-TOKEN`
- **Login** : `POST /api/authentication` avec `{ username, password, rememberMe: true }`
- **Format réponse** : XML (`application/xml`)
- **Syntaxe requête** : `{ "query": "[Mark=NOM]", "collections": ["FR", "EU"], ... }`
- **Champs retournés** : `Mark`, `MarkCurrentStatusCode`, `ApplicationNumber`, `ukey`
