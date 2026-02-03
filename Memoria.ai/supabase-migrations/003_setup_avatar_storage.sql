-- Memoria.ai - Setup Avatar Storage Bucket
-- Created: November 10, 2025
-- Purpose: Create storage bucket for user profile avatars with proper RLS policies
--
-- This migration:
-- 1. Creates 'avatars' storage bucket
-- 2. Sets up RLS policies for secure avatar uploads
-- 3. Allows users to upload/view their own avatars
-- 4. Allows public read access to avatars (for family sharing in future)

-- ============================================================================
-- 1. CREATE AVATARS STORAGE BUCKET
-- ============================================================================
-- Note: This needs to be done in Supabase Dashboard > Storage
--
-- Manual steps in Supabase Dashboard:
-- 1. Go to Storage section
-- 2. Click "New bucket"
-- 3. Name: avatars
-- 4. Public bucket: YES (allow public read access)
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/jpg
--
-- After creating the bucket, run the RLS policies below

-- ============================================================================
-- 2. RLS POLICIES FOR AVATARS BUCKET
-- ============================================================================

-- Policy 1: Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow anyone to view avatars (public read)
-- This is needed so other users can see avatars in family sharing
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================================================
-- ALTERNATIVE: If you prefer to do it all via SQL
-- ============================================================================
-- If you want to create the bucket via SQL (requires admin privileges):
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true);
--
-- Then run the RLS policies above

-- ============================================================================
-- FILE NAMING CONVENTION
-- ============================================================================
-- Files are stored as: avatars/{user_id}-{timestamp}.jpg
-- Example: avatars/abc123-1699564800000.jpg
--
-- This allows:
-- - User ID prefix for RLS policies
-- - Timestamp for uniqueness and cache busting
-- - Automatic old file cleanup (if desired)

-- ============================================================================
-- CLEANUP OLD AVATARS (OPTIONAL)
-- ============================================================================
-- Function to delete old avatar files when a new one is uploaded
-- This keeps storage clean and prevents accumulation

CREATE OR REPLACE FUNCTION cleanup_old_avatars()
RETURNS TRIGGER AS $$
BEGIN
  -- When avatar_url is updated, delete the old file from storage
  IF OLD.avatar_url IS NOT NULL AND OLD.avatar_url != NEW.avatar_url THEN
    -- Extract file path from URL
    -- This is a placeholder - actual implementation depends on your URL structure
    -- You might want to store just the file path instead of full URL
    RAISE NOTICE 'Old avatar URL: %', OLD.avatar_url;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to cleanup old avatars (optional - commented out by default)
-- CREATE TRIGGER cleanup_old_avatars_trigger
--   AFTER UPDATE OF avatar_url ON user_profiles
--   FOR EACH ROW
--   WHEN (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
--   EXECUTE FUNCTION cleanup_old_avatars();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Setup steps:
-- 1. Create bucket in Supabase Dashboard (Storage > New bucket > "avatars")
--    - Set as public bucket
--    - Set file size limit: 5MB
--    - Allowed types: image/jpeg, image/png, image/jpg
-- 2. Run the RLS policies above in Supabase SQL Editor
-- 3. Test upload in the app
--
-- Verification:
-- - Go to Storage > avatars in Supabase Dashboard
-- - Policies tab should show 4 policies
-- - Try uploading a profile picture in the app
-- - Check that file appears in Storage > avatars
--
-- Security:
-- ✅ Users can only upload/update/delete their own avatars
-- ✅ Anyone can view avatars (needed for family sharing)
-- ✅ File paths are prefixed with user ID for security
-- ✅ Public bucket allows direct URL access (no signed URLs needed)
--
-- ============================================================================
