create table if not exists public.user_permissions (
 user_id uuid not null references auth.users(id) on delete cascade,
 permission_key text not null check(permission_key in ('home','center','create','charter','schedule','approvals','publish','list','trash','users')),
 allowed boolean not null default false,
 primary key(user_id,permission_key)
);
alter table public.user_permissions enable row level security;
create policy "Users can read own permissions" on public.user_permissions for select to authenticated using (user_id = (select auth.uid()));
create or replace function public.has_section_permission(p_key text)
returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce((
  select case when up.allowed is not null then up.allowed
   else case
    when p_key in ('home','center','charter','schedule','list') then true
    when p_key in ('create') then p.role = 'support'
    else false end
   end
  from public.user_profiles p
  left join public.user_permissions up on up.user_id=p.id and up.permission_key=p_key
  where p.id=(select auth.uid()) and p.is_approved
 ),false)
 or exists(select 1 from public.user_profiles p where p.id=(select auth.uid()) and p.is_approved and p.is_admin);
$$;
grant execute on function public.has_section_permission(text) to authenticated;
;
