-- TeleRoute App - Supabase Storage Setup
-- Run this SQL in Supabase SQL Editor to create storage bucket and policies

-- ========================================
-- 1. CREATE STORAGE BUCKET
-- ========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meeting-files',
  'meeting-files',
  false,  -- Private bucket (requires auth)
  10485760,  -- 10MB max file size
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- 2. STORAGE POLICIES (RLS) - PUBLIC ACCESS
-- ========================================
-- NOTE: These policies allow public access since there's no auth yet.
-- Replace with authenticated policies when you add authentication.

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload meeting files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view meeting files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update meeting files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete meeting files" ON storage.objects;
DROP POLICY IF EXISTS "Public upload meeting files" ON storage.objects;
DROP POLICY IF EXISTS "Public view meeting files" ON storage.objects;
DROP POLICY IF EXISTS "Public delete meeting files" ON storage.objects;

-- Policy: Anyone can upload files
CREATE POLICY "Public upload meeting files"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'meeting-files');

-- Policy: Anyone can view files
CREATE POLICY "Public view meeting files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'meeting-files');

-- Policy: Anyone can delete files
CREATE POLICY "Public delete meeting files"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'meeting-files');

-- ========================================
-- 3. UPDATE MEETING_FILES TABLE
-- ========================================
-- Add storage_path column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meeting_files' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE meeting_files ADD COLUMN storage_path TEXT;
  END IF;
END $$;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUPABASE STORAGE SETUP COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Bucket: meeting-files';
    RAISE NOTICE 'Max file size: 10MB';
    RAISE NOTICE 'Allowed types: PDF, images, Office docs, text';
    RAISE NOTICE '';
    RAISE NOTICE 'File structure: {user_id}/{meeting_id}/{filename}';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Authentication is required for all operations.';
END $$;
