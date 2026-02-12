-- Supabase Storage Setup for Audio Recordings
-- Run this in Supabase Dashboard -> SQL Editor
-- This creates the "recordings" bucket with proper RLS policies

-- 1. Create the recordings bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recordings',
  'recordings',
  true,  -- Public bucket for easy playback
  52428800,  -- 50MB file size limit
  ARRAY['audio/x-caf', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/*']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/x-caf', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/*']::text[];

-- 2. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow authenticated users to upload to their own folder
-- Users can only upload to recordings/{user_id}/*
DROP POLICY IF EXISTS "Users can upload audio to own folder" ON storage.objects;
CREATE POLICY "Users can upload audio to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Allow authenticated users to update their own files
DROP POLICY IF EXISTS "Users can update own audio files" ON storage.objects;
CREATE POLICY "Users can update own audio files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Allow authenticated users to delete their own files
DROP POLICY IF EXISTS "Users can delete own audio files" ON storage.objects;
CREATE POLICY "Users can delete own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Policy: Allow public read access (for playback)
-- Since bucket is public, anyone can read files
DROP POLICY IF EXISTS "Public can read audio files" ON storage.objects;
CREATE POLICY "Public can read audio files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recordings');

-- Verify setup
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'recordings';
