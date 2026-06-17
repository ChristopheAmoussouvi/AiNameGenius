# AINameGenius — API Backend

> **SMART NAMES. VERIFIED POTENTIAL.**

AI-powered brand naming SaaS. Generates brandable names, checks domain availability via RDAP, pre-checks trademarks, scores results deterministically, and produces PDF reports.

## Stack

- **Framework**: Next.js 14 (App Router) · TypeScript · Vercel
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: OpenAI `gpt-4.1-mini` (JSON strict mode)
- **Domains**: RDAP (Verisign `.com`, AFNIC `.fr`) — free, no API key needed
- **Trademarks**: INPI / EUIPO (stubs — connect in Phase 1)
- **Payments**: Stripe (webhook stub)

## Project structure

```
ainamegenius/
├── app/api/
│   ├── health/                        GET  /api/health
│   ├── projects/                      GET/POST /api/projects
│   │   └── [projectId]/
│   │       ├── route.ts               GET /api/projects/:id
│   │       ├── generate/route.ts      POST /api/projects/:id/generate
│   │       ├── domains/route.ts       POST /api/projects/:id/domains
│   │       ├── trademarks/route.ts    POST /api/projects/:id/trademarks
│   │       ├── logo/route.ts          POST /api/projects/:id/logo
│   │       ├── brand-kit/route.ts     POST /api/projects/:id/brand-kit
│   │       └── report/route.ts        POST /api/projects/:id/report
│   ├── jobs/[jobId]/route.ts          GET  /api/jobs/:id
│   └── webhooks/stripe/route.ts       POST /api/webhooks/stripe
├── lib/
│   ├── api/response.ts                ok() / fail() helpers
│   ├── auth/current-user.ts           JWT verification via Supabase
│   ├── domain/rdap.ts                 RDAP checks (bounded concurrency, cache)
│   ├── domain/affiliate.ts            Namecheap affiliate URL builder
│   ├── llm/openai.ts                  generateStrictJson()
│   ├── llm/naming.ts                  generateNameCandidates() + scoreNameCandidates()
│   ├── scoring/score.ts               computeScore() — deterministic total (no LLM)
│   ├── prompts/naming.ts              LLM prompts for name generation
│   ├── prompts/scoring.ts             LLM prompts for subjective scoring
│   ├── validation/llm.ts              Zod schemas for LLM output
│   ├── validation/project.ts          Zod schemas for API input
│   ├── supabase/server.ts             supabaseAdmin (service role)
│   ├── credits/ledger.ts              debitCredits() / creditCredits()
│   ├── events/track.ts                trackEvent()
│   └── jobs/jobs.ts                   createJob() / updateJob()
├── types/ainamegenius.ts              Core TypeScript types
├── supabase/migrations/
│   ├── 0001_initial_schema.sql        Core tables (users, projects, candidates…)
│   └── 0002_api_support_tables.sql    Jobs, domain cache, events, credits
└── docs/
    ├── prd-v2.md                      PRD MVP & Architecture V2
    └── design-system-v1.md            Design System Reference V1
```

## Anti-hallucination principle

The LLM **never** asserts domain or trademark availability. It only produces subjective scores (`brandability`, `memorability`, etc.). Factual checks (domain status, trademark risk) come exclusively from RDAP and INPI/EUIPO APIs. The `total` score is computed **server-side** by `lib/scoring/score.ts`.

## Setup

### 1. Environment variables

```bash
cp .env.example .env.local
# fill in your values
```

Required:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

### 2. Supabase migrations

```bash
# in the Supabase dashboard SQL editor, run in order:
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_api_support_tables.sql
```

### 3. Install & run

```bash
npm install
npm run dev
```

### 4. Test

```bash
# Health check
curl http://localhost:3000/api/health

# Create a project (replace Bearer token with your Supabase JWT)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Test Project",
    "disclaimer_accepted": true,
    "brief": {
      "industry": "AI SaaS",
      "keywords": ["naming", "brand", "AI"],
      "targetAudience": "startup founders",
      "tone": "premium",
      "languages": ["en", "fr"]
    }
  }'

# Generate names
curl -X POST http://localhost:3000/api/projects/<PROJECT_ID>/generate \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"count": 80}'

# Check domains
curl -X POST http://localhost:3000/api/projects/<PROJECT_ID>/domains \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"names": ["Lumevo", "NovaBrand"], "tlds": [".com", ".fr"]}'
```

## Scoring weights

| Dimension | Weight | Source |
|-----------|--------|--------|
| Brand (brandability + memorability + distinctiveness) | 30% | LLM (subjective) |
| Linguistic (pronounceability + internationalFit − risks) | 15% | LLM (subjective) |
| Domain (.com/.fr availability, weighted) | 30% | RDAP (factual) |
| Trademark (clear/caution/conflict/incomplete) | 25% | INPI/EUIPO (factual) |

## Roadmap

- **Phase 0** (Days 1–3): Form + AI generation + RDAP domain checks + semi-manual report
- **Phase 1** (Days 4–7): Full async pipeline, auto PDF, payments, affiliate domains, logo on favorites
- **Phase 2**: Brand kit, premium report, subscriptions, n8n CRM automation
- **Phase 3**: Robust INPI/EUIPO, phonetic matching, multi-country, trademark monitoring

## P0 patches applied

- `lib/auth/current-user.ts` — real JWT verification (never trusts client-provided user ID)
- `lib/domain/rdap.ts` — bounded concurrency (`mapWithConcurrency`), retry/backoff, Supabase cache
- `lib/scoring/score.ts` — new file, deterministic scoring server-side
- `types/ainamegenius.ts` — removed `total` from `NameScore` (LLM never returns total)
- `lib/validation/llm.ts` — removed `total` from Zod schema
- `lib/prompts/scoring.ts` — removed `total` from prompt example and instructions
- `app/api/projects/[projectId]/generate/route.ts` — `maxDuration=60`, uses `computeScore()`
- `app/api/projects/[projectId]/domains/route.ts` — `maxDuration=60`
- `supabase/migrations/0001_initial_schema.sql` — created (was missing)
