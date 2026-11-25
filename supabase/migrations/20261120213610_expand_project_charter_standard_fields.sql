alter table public.projects
 add column if not exists business_justification text,
 add column if not exists success_criteria text,
 add column if not exists exclusions text,
 add column if not exists assumptions text,
 add column if not exists constraints_text text,
 add column if not exists risks text,
 add column if not exists estimated_budget numeric(18,2) check (estimated_budget is null or estimated_budget>=0),
 add column if not exists budget_currency text not null default 'IRR' check (budget_currency in ('IRR','IRT')),
 add column if not exists sponsor text,
 add column if not exists charter_version integer not null default 1 check (charter_version>0),
 add column if not exists charter_updated_at timestamptz;
;
