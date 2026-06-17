# AINameGenius — API Backend

> **SMART NAMES. VERIFIED POTENTIAL.**

AI-powered brand naming SaaS. Generates brandable names, checks domain availability, pre-checks trademarks, scores results, and helps users buy domains via affiliate links on Namecheap, GoDaddy, and Hostinger.

**Business model**: affiliate commissions on domain registrations.

## Live deployment

| Service | URL | Status |
|---|---|---|
| API | https://ai-name-genius-git-main-koomlojoo-gmailcoms-projects.vercel.app | ✅ Live |
| Health check | /api/health | ✅ `{"ok":true}` |
| Database | Supabase (gejeukrzvgiqfsxvlezz) | ✅ 13 tables |

## Stack

- **Framework**: Next.js 15 (App Router, pure API) · TypeScript · Vercel
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: OpenRouter → `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
- **Domains**: RDAP — `.com` `.net` `.org` `.io` `.co` `.ai` `.fr` `.eu` — free, no API key
- **Affiliate**: Namecheap (GoDaddy + Hostinger — Sprint 1)
- **Trademarks**: INPI / EUIPO (Sprint 1)
- **Payments**: Stripe (Sprint 3)

## Feature status

| Feature | Status | Notes |
|---|---|---|
| Name generation (LLM) | ✅ | 80 names, scored |
| Domain availability | ✅ | RDAP, .com + .fr, 24h cache |
| Affiliate links | ⚠️ | Namecheap only — GoDaddy/Hostinger Sprint 1 |
| Trademark check | ⚠️ | Stub — INPI/EUIPO Sprint 1 |
| Logo generation | ❌ | Sprint 2 |
| Brand kit | ❌ | Sprint 2 |
| PDF report | ❌ | Sprint 2 |
| Frontend | ❌ | Sprint 1 |
| Stripe payments | ❌ | Sprint 3 |

## Project structure

```
ainamegenius/
├── app/api/
│   ├── health/                        GET  /api/health
│   ├── projects/                      GET/POST /api/projects
│   │   └── [projectId]/
│   │       ├── route.ts               GET/DELETE /api/projects/:id
│   │       ├── generate/route.ts      POST /api/projects/:id/generate
│   │       ├── domains/route.ts       POST /api/projects/:id/domains
│   │       ├── trademarks/route.ts    POST /api/projects/:id/trademarks (stub)
│   │       ├── logo/route.ts          POST /api/projects/:id/logo (stub)
│   │       ├── brand-kit/route.ts     POST /api/projects/:id/brand-kit (stub)
│   │       └── report/route.ts        POST /api/projects/:id/report (stub)
│   ├── jobs/[jobId]/route.ts          GET  /api/jobs/:id
│   └── webhooks/stripe/route.ts       POST /api/webhooks/stripe (stub)
├── lib/
│   ├── domain/rdap.ts                 RDAP checks (bounded concurrency, Supabase cache)
│   ├── domain/affiliate.ts            Affiliate URL builder (Namecheap)
│   ├── llm/openai.ts                  generateStrictJson() via OpenRouter
│   ├── llm/naming.ts                  generateNameCandidates() + scoreNameCandidates()
│   ├── scoring/score.ts               computeScore() — deterministic server-side
│   ├── prompts/naming.ts              LLM prompts for name generation
│   ├── prompts/scoring.ts             LLM prompts for subjective scoring
│   ├── validation/llm.ts              Zod schemas for LLM output
│   ├── validation/project.ts          Zod schemas for API input
│   ├── supabase/server.ts             supabaseAdmin (service role)
│   ├── auth/current-user.ts           JWT verification via Supabase
│   ├── credits/ledger.ts              debitCredits() / creditCredits()
│   ├── events/track.ts                trackEvent()
│   └── jobs/jobs.ts                   createJob() / updateJob()
├── types/ainamegenius.ts              Core TypeScript types
└── supabase/migrations/
    ├── 0001_initial_schema.sql        Core tables (users, projects, candidates…)
    └── 0002_api_support_tables.sql    Jobs, domain cache, events, credits
```

## Roadmap

### Sprint 1 — Make it live (week 1-2)
- [ ] Extend RDAP to 7 TLDs: `.com`, `.fr`, `.io`, `.co`, `.net`, `.org`, `.ai`
- [ ] Add GoDaddy + Hostinger affiliate links
- [ ] Integrate INPI or EUIPO trademark API
- [ ] Frontend: landing page + brief form
- [ ] Frontend: results page with domain "Buy" buttons

### Sprint 2 — Complete product (week 3-4)
- [ ] Logo generation (Stability AI or Replicate)
- [ ] Brand kit (colors, fonts, tagline)
- [ ] PDF report download
- [ ] Fix Supabase Auth redirect URL (currently localhost:3000)

### Sprint 3 — Monetisation (week 5-6)
- [ ] Stripe Checkout + webhooks
- [ ] Free / Pro / Business plans
- [ ] Credits system

### Sprint 4 — Growth (week 7-8)
- [ ] SEO: shareable public result pages
- [ ] Analytics (Vercel Analytics or Plausible)
- [ ] Affiliate click tracking

## Environment variables

```bash
# Required — already set in Vercel
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=

# Sprint 1
INPI_API_KEY=
AFFILIATE_GODADDY_ID=
AFFILIATE_NAMECHEAP_ID=
AFFILIATE_HOSTINGER_ID=

# Sprint 2
STABILITY_API_KEY=

# Sprint 3
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Quick API test

```bash
# Health check
curl https://ai-name-genius-git-main-koomlojoo-gmailcoms-projects.vercel.app/api/health

# Authenticated request (replace with your Supabase JWT)
curl https://ai-name-genius-git-main-koomlojoo-gmailcoms-projects.vercel.app/api/projects \
  -H "Authorization: Bearer <your-jwt>"

# Generate names
curl -X POST .../api/projects/<ID>/generate \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"count": 20}'

# Check domains + get affiliate buy links
curl -X POST .../api/projects/<ID>/domains \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"names": ["Lumevo", "NovaBrand"], "tlds": [".com", ".fr"]}'
```

## Scoring model (anti-hallucination)

The LLM **never** asserts domain or trademark availability — only subjective scores. All factual checks come from RDAP and INPI/EUIPO APIs.

| Dimension | Weight | Source |
|---|---|---|
| Brand (brandability + memorability + distinctiveness) | 30% | LLM |
| Linguistic (pronounceability + internationalFit − risks) | 15% | LLM |
| Domain (.com/.fr availability) | 30% | RDAP |
| Trademark (clear/caution/conflict) | 25% | INPI/EUIPO |
