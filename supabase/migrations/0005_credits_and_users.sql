-- 0005_credits_and_users.sql
-- Auto-provision public.users on signup (+ free credits), backfill existing
-- auth users, and add atomic spend/grant credit functions.
-- Idempotent — safe to re-run.

-- ─── Auto-create public.users row on signup (+ 10 free credits) ────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, credits, plan)
  values (new.id, new.email, 10, 'free')
  on conflict (id) do nothing;

  insert into public.credits_ledger (user_id, amount, reason)
  values (new.id, 10, 'signup_bonus');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Backfill existing auth users (fixes projects FK to public.users) ──────────
insert into public.users (id, email, credits, plan)
select id, email, 10, 'free'
from auth.users
on conflict (id) do nothing;

insert into public.credits_ledger (user_id, amount, reason)
select u.id, 10, 'signup_bonus'
from public.users u
where not exists (
  select 1 from public.credits_ledger l where l.user_id = u.id
);

-- ─── Atomic spend (raises 'insufficient_credits' when balance too low) ─────────
create or replace function public.spend_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_project_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  select credits into v_balance from public.users where id = p_user_id for update;
  if v_balance is null then
    raise exception 'user not found';
  end if;
  if v_balance < p_amount then
    raise exception 'insufficient_credits';
  end if;

  update public.users set credits = credits - p_amount where id = p_user_id;
  insert into public.credits_ledger (user_id, project_id, amount, reason)
  values (p_user_id, p_project_id, -p_amount, p_reason);

  return v_balance - p_amount;
end;
$$;

-- ─── Atomic grant (used by Stripe webhook on successful payment) ───────────────
create or replace function public.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_project_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  update public.users set credits = credits + p_amount
  where id = p_user_id
  returning credits into v_balance;

  if v_balance is null then
    raise exception 'user not found';
  end if;

  insert into public.credits_ledger (user_id, project_id, amount, reason)
  values (p_user_id, p_project_id, p_amount, p_reason);

  return v_balance;
end;
$$;
