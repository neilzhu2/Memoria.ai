-- Memoria.ai - Add Date of Birth to User Profiles
-- Created: November 9, 2025
-- Purpose: Add date_of_birth column for age detection and elderly user identification
--
-- This migration:
-- 1. Adds date_of_birth column to user_profiles
-- 2. Updates handle_new_user() function to populate it on signup
-- 3. No RLS changes needed (existing policies cover new column)

-- ============================================================================
-- 1. ADD DATE_OF_BIRTH COLUMN
-- ============================================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.date_of_birth IS
  'User date of birth - used for age calculation and elderly user detection';

-- ============================================================================
-- 2. UPDATE HANDLE_NEW_USER FUNCTION
-- ============================================================================
-- Update the signup trigger to include date_of_birth from signup form

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url, date_of_birth, settings)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    NULL,  -- No avatar initially
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE,  -- From signup form
    '{"theme": "auto"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. HELPER FUNCTION - CALCULATE AGE
-- ============================================================================
-- Optional: Function to get user's current age

CREATE OR REPLACE FUNCTION get_user_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Example usage: SELECT get_user_age(date_of_birth) FROM user_profiles WHERE id = auth.uid();

-- ============================================================================
-- 4. HELPER FUNCTION - IS ELDERLY USER
-- ============================================================================
-- Check if user is 65+ years old (elderly threshold)

CREATE OR REPLACE FUNCTION is_elderly_user(birth_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXTRACT(YEAR FROM AGE(birth_date)) >= 65;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Example usage: SELECT is_elderly_user(date_of_birth) FROM user_profiles WHERE id = auth.uid();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Changes made:
-- ✅ Added date_of_birth column to user_profiles
-- ✅ Updated handle_new_user() function
-- ✅ Added get_user_age() helper function
-- ✅ Added is_elderly_user() helper function
--
-- RLS Policies: No changes needed (existing policies cover this column)
--
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Update signup form to collect date_of_birth
-- 3. Update EditProfileModal to allow editing date_of_birth
-- 4. Use is_elderly_user() to customize UI for elderly users
--
-- ============================================================================
