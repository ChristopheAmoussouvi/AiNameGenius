-- 0002_api_support_tables.sql
-- Support tables: jobs, domain cache, events, credits ledger
-- Requires 0001_initial_schema.sql to have been applied first.

-- ─── Enums (add only if not already present in 0001_initial_schema.sql) ───────
do $$ begin
  create type job_status as enum ('pending', 'running', 'completed', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type domain_status as enum ('available', 'taken', 'premium', 'unknown');
exception when duplicate_object then null; end $$;

-- ─── Generation jobs ──────────────────────────────────────────────────────────
create table if not exists public.generation_jobs (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  user_id          uuid not null references public.users(id) on delete cascade,
  type             text not null,
  status           text not null default 'pending',
  idempotency_key  text unique,
  result           jsonb,
  error            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists generation_jobs_project_id_idx on public.generation_jobs(project_id);
create index if not exists generation_jobs_user_id_idx on public.generation_jobs(user_id);
create index if not exists generation_jobs_idempotency_key_idx on public.generation_jobs(idempotency_key)
  where idempotency_key is not null;

create trigger generation_jobs_updated_at
  before update on public.generation_jobs
  for each row execute function trigger_set_updated_at();

alter table public.generation_jobs enable row level security;

create policy "generation_jobs: owner only"
  on public.generation_jobs for all
  using (auth.uid() = user_id);

-- ─── Domain results (RDAP cache) ─────────────────────────────────────────────
create table if not exists public.domain_results (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  tld         text not null,
  status      text not null default 'unknown',
  checked_at  timestamptz not null default now(),
  unique (name, tld)
);

create index if not exists domain_results_name_tld_idx on public.domain_results(name, tld);

alter table public.domain_results enable row level security;

-- Domain cache is readable by all authenticated users (shared cache)
create policy "domain_results: authenticated read"
  on public.domain_results for select
  using (auth.role() = 'authenticated');

-- Only service role can write (server-side only)
create policy "domain_results: service role write"
  on public.domain_results for insert
  with check (auth.role() = 'service_role');

create policy "domain_results: service role update"
  on public.domain_results for update
  using (auth.role() = 'service_role');

-- ─── Events ───────────────────────────────────────────────────────────────────
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete set null,
  project_id  uuid references public.projects(id) on delete set null,
  type        text not null,
  properties  jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists events_user_id_idx on public.events(user_id);
create index if not exists events_project_id_idx on public.events(project_id);
create index if not exists events_type_idx on public.events(type);

alter table public.events enable row level security;

create policy "events: owner read"
  on public.events for select
  using (auth.uid() = user_id);

-- ─── Credits ledger ───────────────────────────────────────────────────────────
create table if not exists public.credits_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  project_id  uuid references public.projects(id) on delete set null,
  amount      integer not null,  -- positive = credit, negative = debit
  reason      text not null,
  created_at  timestamptz not null default now()
);

create index if not exists credits_ledger_user_id_idx on public.credits_ledger(user_id);

alter table public.credits_ledger enable row level security;

create policy "credits_ledger: owner read"
  on public.credits_ledger for select
  using (auth.uid() = user_id);
