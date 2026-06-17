-- 0001_initial_schema.sql
-- Core tables for AINameGenius
-- Run this before 0002_api_support_tables.sql

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Helper: auto-update updated_at ───────────────────────────────────────────
create or replace function trigger_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Users (mirrors auth.users, enriched with app data) ───────────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  credits     integer not null default 0,
  plan        text not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger users_updated_at
  before update on public.users
  for each row execute function trigger_set_updated_at();

alter table public.users enable row level security;

create policy "users: own row only"
  on public.users for all
  using (auth.uid() = id);

-- ─── Projects ─────────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text not null,
  brief       jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);

create trigger projects_updated_at
  before update on public.projects
  for each row execute function trigger_set_updated_at();

alter table public.projects enable row level security;

create policy "projects: owner only"
  on public.projects for all
  using (auth.uid() = user_id);

-- ─── Name candidates ──────────────────────────────────────────────────────────
create table if not exists public.name_candidates (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  rationale   text,
  created_at  timestamptz not null default now()
);

create index if not exists name_candidates_project_id_idx on public.name_candidates(project_id);

alter table public.name_candidates enable row level security;

create policy "name_candidates: project owner"
  on public.name_candidates for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- ─── Scores ───────────────────────────────────────────────────────────────────
create table if not exists public.scores (
  id                uuid primary key default gen_random_uuid(),
  candidate_id      uuid not null references public.name_candidates(id) on delete cascade,
  project_id        uuid not null references public.projects(id) on delete cascade,
  brandability      integer,
  memorability      integer,
  pronounceability  integer,
  distinctiveness   integer,
  international_fit integer,
  descriptive_risk  integer,
  linguistic_risk   integer,
  brand_score       integer,
  linguistic_score  integer,
  domain_score      integer,
  trademark_score   integer,
  total             integer,
  created_at        timestamptz not null default now()
);

create index if not exists scores_candidate_id_idx on public.scores(candidate_id);
create index if not exists scores_project_id_idx on public.scores(project_id);

alter table public.scores enable row level security;

create policy "scores: project owner"
  on public.scores for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- ─── Trademark results ────────────────────────────────────────────────────────
create table if not exists public.trademark_results (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  candidate_id  uuid references public.name_candidates(id) on delete set null,
  name          text not null,
  jurisdiction  text not null default 'EU',
  status        text not null default 'incomplete',
  raw           jsonb,
  checked_at    timestamptz not null default now()
);

create index if not exists trademark_results_project_id_idx on public.trademark_results(project_id);

alter table public.trademark_results enable row level security;

create policy "trademark_results: project owner"
  on public.trademark_results for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- ─── Reports ──────────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  format      text not null default 'pdf',
  url         text,
  created_at  timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "reports: project owner"
  on public.reports for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- ─── Affiliate links ──────────────────────────────────────────────────────────
create table if not exists public.affiliate_links (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  tld         text not null,
  url         text not null,
  clicks      integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.affiliate_links enable row level security;

create policy "affiliate_links: project owner"
  on public.affiliate_links for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- ─── Logo jobs ────────────────────────────────────────────────────────────────
create table if not exists public.logo_jobs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  status      text not null default 'pending',
  result_url  text,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger logo_jobs_updated_at
  before update on public.logo_jobs
  for each row execute function trigger_set_updated_at();

alter table public.logo_jobs enable row level security;

create policy "logo_jobs: project owner"
  on public.logo_jobs for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- ─── Brand kits ───────────────────────────────────────────────────────────────
create table if not exists public.brand_kits (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  status      text not null default 'pending',
  data        jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger brand_kits_updated_at
  before update on public.brand_kits
  for each row execute function trigger_set_updated_at();

alter table public.brand_kits enable row level security;

create policy "brand_kits: project owner"
  on public.brand_kits for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
