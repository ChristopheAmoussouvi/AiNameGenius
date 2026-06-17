# AINameGenius — Roadmap

_Dernière mise à jour : 17 juin 2026 — auto-mis à jour à chaque commit_

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

### Marques (INPI)
- [x] `lib/trademark/inpi.ts` — client INPI Data API (Bearer token)
- [x] `lib/trademark/check.ts` — orchestrateur avec niveaux de risque (clear / caution / conflict / incomplete)
- [x] Route `/trademarks` connectée — persiste dans `trademark_results`
- [x] Migration `0003_trademark_unique.sql` — contrainte unique pour upsert
- [ ] **ACTION** : S'inscrire sur https://data.inpi.fr/register et obtenir `INPI_API_KEY`
- [ ] Ajouter `INPI_API_KEY` dans Vercel env vars
- [ ] Appliquer la migration `0003` dans le SQL Editor Supabase

### Frontend
- [ ] Page d'accueil + formulaire brief
- [ ] Page de résultats : noms + domaines + boutons "Acheter"
- [ ] Corriger URL redirect Supabase Auth (actuellement `localhost:3000`)

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
| `AFFILIATE_NAMECHEAP_ID` | ❌ À ajouter | namecheap.com/affiliates |
| `AFFILIATE_GODADDY_ID` | ❌ À ajouter | godaddy.com/affiliate-programs |
| `AFFILIATE_HOSTINGER_ID` | ❌ À ajouter | hostinger.fr/affilies |
| `INPI_API_KEY` | ❌ À ajouter | data.inpi.fr |
| `STABILITY_API_KEY` | ❌ Sprint 2 | platform.stability.ai |
| `STRIPE_SECRET_KEY` | ❌ Sprint 3 | dashboard.stripe.com |
| `STRIPE_WEBHOOK_SECRET` | ❌ Sprint 3 | dashboard.stripe.com |

---

## Réponse API `/domains` — format actuel

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
  },
  {
    "name": "NovaBrand",
    "tld": ".com",
    "status": "taken",
    "buyLinks": null
  }
]
```
