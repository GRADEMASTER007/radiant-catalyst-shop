-- Move has_role out of the public API schema so signed-in users cannot invoke a SECURITY DEFINER function directly via PostgREST.
CREATE SCHEMA IF NOT EXISTS private;

-- Move the function; policy references stay valid because they bind by OID.
ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;

-- Ensure grants: authenticated must still be able to execute it during RLS evaluation.
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Allow authenticated role to resolve the schema during RLS eval.
GRANT USAGE ON SCHEMA private TO authenticated, service_role;