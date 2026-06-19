-- 0004_brand_assets.sql
-- Brand kit storage bucket + one-brand-kit-per-project constraint.
-- Requires 0001_initial_schema.sql.

-- ─── One brand kit per project (enables upsert on project_id) ─────────────────
alter table public.brand_kits
  add constraint brand_kits_project_id_unique unique (project_id);

-- ─── Public storage bucket for generated logos ────────────────────────────────
insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

-- Public read of brand assets (bucket is public; objects served via public URL)
do $$ begin
  create policy "brand-assets: public read"
    on storage.objects for select
    using (bucket_id = 'brand-assets');
exception when duplicate_object then null; end $$;

-- Writes happen server-side with the service role, which bypasses RLS.
