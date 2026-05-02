-- Revoke client EXECUTE on trigger-only and internal SECURITY DEFINER functions.
-- These are invoked by Postgres triggers or by other SECURITY DEFINER functions,
-- never directly by the PostgREST API, so anon/authenticated do not need EXECUTE.
-- has_role() is intentionally left executable because RLS policies depend on it.

REVOKE EXECUTE ON FUNCTION public.enforce_single_primary_provider() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_quotation_number() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_blog_delete_redirect() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_blog_slug_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_page_slug_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_product_delete_redirect() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_product_slug_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_slug_redirect(text, text, text, text) FROM anon, authenticated, PUBLIC;

-- Service role keeps full access for backend/edge function operations.
GRANT EXECUTE ON FUNCTION public.enforce_single_primary_provider() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_quotation_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_blog_delete_redirect() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_blog_slug_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_page_slug_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_product_delete_redirect() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_product_slug_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
GRANT EXECUTE ON FUNCTION public.record_slug_redirect(text, text, text, text) TO service_role;