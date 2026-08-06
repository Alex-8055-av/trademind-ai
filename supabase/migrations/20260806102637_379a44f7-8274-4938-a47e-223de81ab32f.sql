CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Private SECURITY DEFINER implementations (not in the exposed API schema)
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION private.current_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan FROM public.subscriptions
      WHERE user_id = _user_id AND status = 'active'
      ORDER BY public.plan_rank(plan) DESC LIMIT 1),
    (SELECT plan FROM public.profiles WHERE id = _user_id),
    'free'
  );
$$;

CREATE OR REPLACE FUNCTION private.has_min_plan(_user_id uuid, _min_plan text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.plan_rank(private.current_plan(_user_id)) >= public.plan_rank(_min_plan) $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.current_plan(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_min_plan(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.current_plan(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_min_plan(uuid, text) TO authenticated, service_role;

-- Public wrappers become SECURITY INVOKER thin pass-throughs so existing policies keep working
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT private.has_role(_user_id, _role) $$;

CREATE OR REPLACE FUNCTION public.current_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT private.current_plan(_user_id) $$;

CREATE OR REPLACE FUNCTION public.has_min_plan(_user_id uuid, _min_plan text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT private.has_min_plan(_user_id, _min_plan) $$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_plan(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_min_plan(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_plan(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_min_plan(uuid, text) TO authenticated, service_role;