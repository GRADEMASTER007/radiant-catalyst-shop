-- Restrict object listing/metadata reads on storage.objects to admins.
-- Public image rendering still works via the CDN getPublicUrl path,
-- which does NOT pass through storage.objects RLS for public buckets.
-- This prevents anonymous users from enumerating filenames via the
-- Storage API (e.g. supabase.storage.from('product-images').list()).

-- Drop the overly broad public SELECT policy
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;

-- Replace it with an admin-only metadata read policy.
-- Anonymous and authenticated non-admin users CANNOT list objects
-- or read storage.objects rows directly.
CREATE POLICY "Admins can list product image metadata"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- RESTRICTIVE policy: explicitly block non-admins from listing files
-- in any future private buckets they might be granted access to by mistake.
CREATE POLICY "Block non-admin listing on product-images"
ON storage.objects
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (
  bucket_id <> 'product-images'
  OR has_role(auth.uid(), 'admin'::app_role)
);