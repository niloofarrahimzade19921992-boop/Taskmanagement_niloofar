alter table public.projects add column if not exists objective text not null default '', add column if not exists scope text not null default '', add column if not exists deliverables text not null default '', add column if not exists stakeholders text not null default '', add column if not exists approver text not null default '', add column if not exists workflow_status text not null default 'draft', add column if not exists decided_by uuid references auth.users(id), add column if not exists decided_at timestamptz;
alter table public.projects add constraint projects_workflow_status_check check (workflow_status in ('draft','pending','approved','rejected','published'));
create table if not exists public.project_phases (id bigint generated always as identity primary key, project_id bigint not null references public.projects(id) on delete cascade, title text not null, start_date date not null, end_date date not null, progress integer not null default 0 check (progress between 0 and 100), created_at timestamptz not null default now(), constraint phase_date_order check (end_date >= start_date));
alter table public.project_phases enable row level security;
create policy "Approved users can view phases" on public.project_phases for select to authenticated using (exists(select 1 from public.projects p where p.id=project_id));
create policy "Project editors can add phases" on public.project_phases for insert to authenticated with check (exists(select 1 from public.user_profiles u where u.id=(select auth.uid()) and u.is_approved and (u.is_admin or u.role='support')) and exists(select 1 from public.projects p where p.id=project_id and p.workflow_status in ('draft','rejected')));
create policy "Project editors can update phases" on public.project_phases for update to authenticated using (exists(select 1 from public.user_profiles u where u.id=(select auth.uid()) and u.is_approved and (u.is_admin or u.role='support')) and exists(select 1 from public.projects p where p.id=project_id and p.workflow_status in ('draft','rejected'))) with check (exists(select 1 from public.user_profiles u where u.id=(select auth.uid()) and u.is_approved and (u.is_admin or u.role='support')) and exists(select 1 from public.projects p where p.id=project_id and p.workflow_status in ('draft','rejected')));
create policy "Project editors can delete phases" on public.project_phases for delete to authenticated using (exists(select 1 from public.user_profiles u where u.id=(select auth.uid()) and u.is_approved and (u.is_admin or u.role='support')) and exists(select 1 from public.projects p where p.id=project_id and p.workflow_status in ('draft','rejected')));
create or replace function public.project_workflow_guard() returns trigger language plpgsql set search_path='' as $$
declare is_manager boolean;
begin
  if current_user in ('postgres','service_role') then return new; end if;
  select coalesce(u.is_admin,false) into is_manager from public.user_profiles u where u.id=auth.uid() and u.is_approved;
  if new.workflow_status is distinct from old.workflow_status then
    if old.workflow_status in ('draft','rejected') and new.workflow_status='pending' and length(trim(new.objective))>0 then
      null;
    elsif old.workflow_status='pending' and new.workflow_status in ('approved','rejected') and coalesce(is_manager,false) then
      new.decided_by:=auth.uid(); new.decided_at:=now();
    elsif old.workflow_status='approved' and new.workflow_status='published' and coalesce(is_manager,false) then
      null;
    else
      raise exception 'Invalid project workflow transition';
    end if;
  end if;
  if old.workflow_status in ('pending','approved','published') and (new.name,new.manager,new.start_date,new.end_date,new.description,new.objective,new.scope,new.deliverables,new.stakeholders,new.approver) is distinct from (old.name,old.manager,old.start_date,old.end_date,old.description,old.objective,old.scope,old.deliverables,old.stakeholders,old.approver) then
    raise exception 'Project content is locked during approval/publication';
  end if;
  return new;
end; $$;
create trigger project_workflow_guard_trigger before update on public.projects for each row execute function public.project_workflow_guard();;
