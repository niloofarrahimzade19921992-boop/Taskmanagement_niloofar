drop policy if exists "Approved users can view projects" on public.projects;
create policy "Approved users can view projects" on public.projects for select to authenticated using (
 public.has_section_permission('center') or public.has_section_permission('list') or public.has_section_permission('charter') or public.has_section_permission('schedule') or public.has_section_permission('approvals') or public.has_section_permission('publish') or public.has_section_permission('trash')
);
drop policy if exists "Admin and support can create projects" on public.projects;
create policy "Admin and support can create projects" on public.projects for insert to authenticated with check (
 public.has_section_permission('create') and exists(select 1 from public.user_profiles p where p.id=(select auth.uid()) and p.is_approved and (p.is_admin or p.role='support'))
);
drop policy if exists "Admin and support can update projects" on public.projects;
create policy "Admin and support can update projects" on public.projects for update to authenticated using (
 exists(select 1 from public.user_profiles p where p.id=(select auth.uid()) and p.is_approved and (p.is_admin or p.role='support'))
 and (public.has_section_permission('charter') or public.has_section_permission('approvals') or public.has_section_permission('publish') or public.has_section_permission('trash'))
) with check (
 exists(select 1 from public.user_profiles p where p.id=(select auth.uid()) and p.is_approved and (p.is_admin or p.role='support'))
 and (public.has_section_permission('charter') or public.has_section_permission('approvals') or public.has_section_permission('publish') or public.has_section_permission('trash'))
);
;
