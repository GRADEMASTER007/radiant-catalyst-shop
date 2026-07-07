-- Revoke execute from PUBLIC (covers anon + authenticated) on internal SECURITY DEFINER helpers.
REVOKE EXECUTE ON FUNCTION public.handle_page_slug_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_product_delete_redirect() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_blog_slug_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_blog_delete_redirect() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_quotation_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_single_primary_provider() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_product_slug_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_slug_redirect(text, text, text, text) FROM PUBLIC, anon, authenticated;

-- has_role must remain callable by authenticated (RLS policies invoke it), but not by anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;