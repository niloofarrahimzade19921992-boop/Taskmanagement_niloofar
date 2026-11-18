-- PM schema upgrade. Review and execute in Supabase SQL Editor.
-- Existing project and task records are preserved.
BEGIN;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS pm_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_pm_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_pm_status_check CHECK (pm_status IN ('draft','pending_review','published','returned','closed'));
CREATE TABLE IF NOT EXISTS public.project_members(project_id bigint NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,created_at timestamptz DEFAULT now(),PRIMARY KEY(project_id,user_id));
CREATE TABLE IF NOT EXISTS public.project_charters(project_id bigint PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,objectives text NOT NULL DEFAULT '',scope text NOT NULL DEFAULT '',deliverables text NOT NULL DEFAULT '',stakeholders text DEFAULT '',updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.project_phases(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,project_id bigint NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,title text NOT NULL,start_date date NOT NULL,end_date date NOT NULL,progress_percent integer NOT NULL DEFAULT 0 CHECK(progress_percent BETWEEN 0 AND 100),CHECK(end_date>=start_date));
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_charters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.pm_is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id=auth.uid() AND is_approved=true AND (is_admin=true OR role IN ('admin','manager'))) $$;
CREATE OR REPLACE FUNCTION public.pm_is_approved() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id=auth.uid() AND is_approved=true) $$;
CREATE OR REPLACE FUNCTION public.pm_can_view(pid bigint) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.pm_is_approved() AND EXISTS(SELECT 1 FROM public.projects p WHERE p.id=pid AND (p.owner_id=auth.uid() OR public.pm_is_admin() OR EXISTS(SELECT 1 FROM public.project_members m WHERE m.project_id=p.id AND m.user_id=auth.uid()))) $$;
CREATE OR REPLACE FUNCTION public.pm_can_edit(pid bigint) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.pm_is_approved() AND EXISTS(SELECT 1 FROM public.projects p WHERE p.id=pid AND (p.owner_id=auth.uid() OR public.pm_is_admin())) $$;
-- Replace the previously broad project policies, not the stored data.
DROP POLICY IF EXISTS "Approved users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admin and support can create projects" ON public.projects;
DROP POLICY IF EXISTS "Admin and support can update projects" ON public.projects;
DROP POLICY IF EXISTS "pm_projects_read" ON public.projects;
DROP POLICY IF EXISTS "pm_projects_create" ON public.projects;
DROP POLICY IF EXISTS "pm_projects_update" ON public.projects;
CREATE POLICY pm_projects_read ON public.projects FOR SELECT TO authenticated USING (public.pm_can_view(id));
CREATE POLICY pm_projects_create ON public.projects FOR INSERT TO authenticated WITH CHECK(public.pm_is_approved() AND owner_id=auth.uid() AND pm_status='draft');
CREATE POLICY pm_projects_update ON public.projects FOR UPDATE TO authenticated USING(public.pm_can_edit(id)) WITH CHECK(public.pm_can_edit(id));
DROP POLICY IF EXISTS pm_members_read ON public.project_members;
DROP POLICY IF EXISTS pm_members_insert ON public.project_members;
CREATE POLICY pm_members_read ON public.project_members FOR SELECT TO authenticated USING(public.pm_can_view(project_id));
CREATE POLICY pm_members_insert ON public.project_members FOR INSERT TO authenticated WITH CHECK(public.pm_can_edit(project_id) AND EXISTS(SELECT 1 FROM public.user_profiles WHERE id=user_id AND is_approved=true));
DROP POLICY IF EXISTS pm_charters_read ON public.project_charters;
DROP POLICY IF EXISTS pm_charters_insert ON public.project_charters;
DROP POLICY IF EXISTS pm_charters_update ON public.project_charters;
CREATE POLICY pm_charters_read ON public.project_charters FOR SELECT TO authenticated USING(public.pm_can_view(project_id));
CREATE POLICY pm_charters_insert ON public.project_charters FOR INSERT TO authenticated WITH CHECK(public.pm_can_edit(project_id));
CREATE POLICY pm_charters_update ON public.project_charters FOR UPDATE TO authenticated USING(public.pm_can_edit(project_id)) WITH CHECK(public.pm_can_edit(project_id));
DROP POLICY IF EXISTS pm_phases_read ON public.project_phases;
DROP POLICY IF EXISTS pm_phases_insert ON public.project_phases;
DROP POLICY IF EXISTS pm_phases_update ON public.project_phases;
CREATE POLICY pm_phases_read ON public.project_phases FOR SELECT TO authenticated USING(public.pm_can_view(project_id));
CREATE POLICY pm_phases_insert ON public.project_phases FOR INSERT TO authenticated WITH CHECK(public.pm_can_edit(project_id));
CREATE POLICY pm_phases_update ON public.project_phases FOR UPDATE TO authenticated USING(public.pm_can_edit(project_id)) WITH CHECK(public.pm_can_edit(project_id));
-- Prevent non-admins from bypassing publication approval via direct API requests.
CREATE OR REPLACE FUNCTION public.pm_validate_project_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ready boolean;
BEGIN
 IF TG_OP='INSERT' THEN RETURN NEW; END IF;
 IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN RAISE EXCEPTION 'Project ownership cannot be changed'; END IF;
 IF NEW.pm_status IS DISTINCT FROM OLD.pm_status THEN
   IF NEW.pm_status='pending_review' AND OLD.pm_status IN ('draft','returned') AND (OLD.owner_id=auth.uid() OR public.pm_is_admin()) THEN
     SELECT EXISTS(SELECT 1 FROM public.project_charters c WHERE c.project_id=OLD.id AND length(trim(c.objectives))>0 AND length(trim(c.scope))>0 AND length(trim(c.deliverables))>0) AND EXISTS(SELECT 1 FROM public.project_phases s WHERE s.project_id=OLD.id) INTO ready;
     IF NOT ready THEN RAISE EXCEPTION 'Complete charter and schedule before requesting publication'; END IF;
   ELSIF NEW.pm_status IN ('published','returned') AND OLD.pm_status='pending_review' AND public.pm_is_admin() THEN
     NULL;
   ELSIF NEW.pm_status='closed' AND OLD.pm_status='published' AND public.pm_is_admin() THEN
     NULL;
   ELSE RAISE EXCEPTION 'Invalid project status transition or insufficient permission';
   END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pm_project_status_guard ON public.projects;
CREATE TRIGGER pm_project_status_guard BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.pm_validate_project_change();
-- Create an unapproved profile automatically when a new user signs up.
CREATE OR REPLACE FUNCTION public.pm_create_signup_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN INSERT INTO public.user_profiles(id,full_name,is_approved,is_admin,role)
VALUES(NEW.id,COALESCE(NEW.raw_user_meta_data->>'full_name',''),false,false,'user')
ON CONFLICT(id) DO NOTHING; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS pm_auth_signup_profile ON auth.users;
CREATE TRIGGER pm_auth_signup_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.pm_create_signup_profile();
COMMIT;
-- IMPORTANT: review existing policies on user_profiles. Admin approval needs
-- a secure UPDATE policy for pm_is_admin(); users should only read approved
-- profiles, and admin can read pending ones. Do not add broad SELECT/UPDATE.

-- Profile access required by registration, team assignment and administrator approval.
-- IMPORTANT: inspect any pre-existing policies on user_profiles before running;
-- permissive policies are combined with OR and could expose data.
DROP POLICY IF EXISTS pm_profiles_select ON public.user_profiles;
DROP POLICY IF EXISTS pm_profiles_admin_update ON public.user_profiles;
CREATE POLICY pm_profiles_select ON public.user_profiles FOR SELECT TO authenticated
USING (id=auth.uid() OR public.pm_is_admin() OR (public.pm_is_approved() AND is_approved=true));
CREATE POLICY pm_profiles_admin_update ON public.user_profiles FOR UPDATE TO authenticated
USING (public.pm_is_admin()) WITH CHECK (public.pm_is_admin());
-- Existing projects have no owner_id. Administrators should assign their
-- actual owner UUIDs explicitly before enforcing private visibility.
-- Example (replace placeholders only after confirming ownership):
-- UPDATE public.projects SET owner_id='ACTUAL-USER-UUID' WHERE id=ACTUAL-PROJECT-ID;
