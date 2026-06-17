-- 0003_trademark_unique.sql
-- Adds unique constraint on trademark_results(project_id, name, jurisdiction)
-- Required for upsert in the trademark check route.

alter table public.trademark_results
  add constraint trademark_results_project_name_jurisdiction_unique
  unique (project_id, name, jurisdiction);
