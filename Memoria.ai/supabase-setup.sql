-- Memoria.ai Supabase Database Schema
-- Run this SQL in Supabase SQL Editor to set up the database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
-- Extends Supabase auth.users with additional profile information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{
    "autoBackupEnabled": false,
    "lastBackupDate": null,
    "theme": "auto"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memories Table
-- Stores all user memories with metadata
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  transcription TEXT,
  audio_url TEXT,
  duration INTEGER, -- in seconds
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  theme TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_date ON memories(date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_theme ON memories(theme);

-- Enable full-text search on transcriptions
CREATE INDEX IF NOT EXISTS idx_memories_transcription_search
  ON memories USING gin(to_tsvector('english', transcription));

-- Row-Level Security (RLS) Policies

-- Enable RLS on tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Memories RLS Policies
-- Users can view their own memories
CREATE POLICY "Users can view own memories" ON memories
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own memories
CREATE POLICY "Users can insert own memories" ON memories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own memories
CREATE POLICY "Users can update own memories" ON memories
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own memories
CREATE POLICY "Users can delete own memories" ON memories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for audio files
-- Run this in Supabase Dashboard > Storage or via SQL:
-- Note: Storage buckets are created via Supabase Dashboard, not SQL
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket named 'audio-recordings'
-- 3. Set it to private (not public)
-- 4. Add RLS policies for the bucket (see below)

-- Storage RLS Policies (to be set in Supabase Dashboard > Storage > audio-recordings > Policies)
-- Policy 1: Users can upload their own audio files
-- Name: Users can upload own audio
-- Allowed operations: INSERT
-- Policy definition: bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]

-- Policy 2: Users can view their own audio files
-- Name: Users can view own audio
-- Allowed operations: SELECT
-- Policy definition: bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]

-- Policy 3: Users can update their own audio files
-- Name: Users can update own audio
-- Allowed operations: UPDATE
-- Policy definition: bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]

-- Policy 4: Users can delete their own audio files
-- Name: Users can delete own audio
-- Allowed operations: DELETE
-- Policy definition: bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]
