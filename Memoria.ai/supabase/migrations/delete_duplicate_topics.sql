-- Migration: Delete duplicate topics
-- Created: December 9, 2025
-- Purpose: Remove duplicate topics that were inserted twice

-- ============================================
-- Delete duplicates, keeping the oldest one
-- ============================================

-- First, let's see what we're about to delete
WITH duplicates AS (
  SELECT
    prompt,
    array_agg(id ORDER BY created_at) as topic_ids,
    COUNT(*) as duplicate_count
  FROM recording_topics
  GROUP BY prompt
  HAVING COUNT(*) > 1
)
SELECT
  prompt,
  unnest(topic_ids[2:]) as id_to_delete  -- All IDs except the first (oldest)
FROM duplicates;

-- Now delete them
DELETE FROM recording_topics
WHERE id IN (
  WITH duplicates AS (
    SELECT
      prompt,
      array_agg(id ORDER BY created_at) as topic_ids
    FROM recording_topics
    GROUP BY prompt
    HAVING COUNT(*) > 1
  )
  SELECT unnest(topic_ids[2:])  -- Keep first, delete rest
  FROM duplicates
);

-- Verify - should show 0 duplicates now
WITH duplicates AS (
  SELECT
    prompt,
    COUNT(*) as count
  FROM recording_topics
  GROUP BY prompt
  HAVING COUNT(*) > 1
)
SELECT COUNT(*) as remaining_duplicates FROM duplicates;

-- Re-sync usage counts
SELECT sync_all_topic_usage_counts();

-- Show final state
SELECT COUNT(*) as total_topics FROM recording_topics;
