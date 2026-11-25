drop policy if exists "Project editors can add phases" on public.project_phases;
create policy "Project editors can add phases" on public.project_phases for insert to authenticated with check (
 public.has_section_permission('schedule') and exists(select 1 from public.user_profiles u where u.id=(select auth.uid()) and u.is_approved and (u.is_admin or u.role='support'))
 and exists(select 1 from public.projects p where p.id=project_phases.project_id and p.workflow_status in ('draft','rejected'))
);
drop policy if exists "Project editors can update phases" on public.project_phases;
create policy "Project editors can update phases" on public.project_phases for update to authenticated using (
 public.has_section_permission('schedule') and exists(select 1 from public.user_profiles u where u.id=(select auth.uid()) and u.is_approved and (u.is_admin or u.role='support'))
 and exists(select 1 from public.projects p where p.id=project_phases.project_id and p.workflow_status in ('draft','rejected'))
) with check (
 public.has_section_permission('schedule') and exists(select 1 from public.user_profiles u where u.id=(select auth.uid()) and u.is_approved and (u.is_admin or u.role='support'))
 and exists(select 1 from public.projects p where p.id=project_phases.project_id and p.workflow_status in ('draft','rejected'))
);
drop policy if exists "Project editors can delete phases" on public.project_phases;
create policy "Project editors can delete phases" on public.project_phases for delete to authenticated using (
 public.has_section_permission('schedule') and exists(select 1 from public.user_profiles u where u.id=(select auth.uid()) and u.is_approved and (u.is_admin or u.role='support'))
 and exists(select 1 from public.projects p where p.id=project_phases.project_id and p.workflow_status in ('draft','rejected'))
);;
