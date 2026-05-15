-- =============================================================
-- 0031_fix_storage_policies.sql
-- Loosens storage policies for the drive to ensure uploads work
-- =============================================================

-- Drop existing restricted policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Create comprehensive policies for agency_drive
CREATE POLICY "Anyone can view agency_drive"
ON storage.objects FOR SELECT
USING ( bucket_id = 'agency_drive' );

CREATE POLICY "Authenticated users can manage agency_drive"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'agency_drive' )
WITH CHECK ( bucket_id = 'agency_drive' );

-- Ensure the bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'agency_drive';
