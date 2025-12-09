-- Migration: Add trigger to increment recording_topics.usage_count
-- Created: December 7, 2025
-- Purpose: Automatically track how many times each topic has been used for recordings

-- ============================================
-- 1. Create function to sync ALL usage_counts from scratch
-- ============================================
-- This function recalculates all usage_counts by counting actual memories
-- Call this anytime you need to verify/fix data integrity
CREATE OR REPLACE FUNCTION sync_all_topic_usage_counts()
RETURNS void AS $$
BEGIN
  -- First, reset all counts to 0
  UPDATE recording_topics SET usage_count = 0;

  -- Then, count actual memories for each topic and update
  UPDATE recording_topics rt
  SET usage_count = (
    SELECT COUNT(*)
    FROM memories m
    WHERE m.topic_id = rt.id
  );

  RAISE NOTICE 'Successfully synced all topic usage counts';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Create function to increment usage_count (INSERT)
-- ============================================
CREATE OR REPLACE FUNCTION increment_topic_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if topic_id is not null
  IF NEW.topic_id IS NOT NULL THEN
    UPDATE recording_topics
    SET usage_count = usage_count + 1
    WHERE id = NEW.topic_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Create function to decrement usage_count (DELETE)
-- ============================================
CREATE OR REPLACE FUNCTION decrement_topic_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrement if topic_id is not null
  IF OLD.topic_id IS NOT NULL THEN
    UPDATE recording_topics
    SET usage_count = GREATEST(0, usage_count - 1)  -- Don't go below 0
    WHERE id = OLD.topic_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Create function to handle topic_id changes (UPDATE)
-- ============================================
CREATE OR REPLACE FUNCTION update_topic_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- If topic_id changed from one topic to another
  IF OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
    -- Decrement old topic (if it existed)
    IF OLD.topic_id IS NOT NULL THEN
      UPDATE recording_topics
      SET usage_count = GREATEST(0, usage_count - 1)
      WHERE id = OLD.topic_id;
    END IF;

    -- Increment new topic (if it exists)
    IF NEW.topic_id IS NOT NULL THEN
      UPDATE recording_topics
      SET usage_count = usage_count + 1
      WHERE id = NEW.topic_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Create triggers on memories table
-- ============================================
DROP TRIGGER IF EXISTS trigger_increment_topic_usage ON memories;
CREATE TRIGGER trigger_increment_topic_usage
  AFTER INSERT ON memories
  FOR EACH ROW
  EXECUTE FUNCTION increment_topic_usage_count();

DROP TRIGGER IF EXISTS trigger_decrement_topic_usage ON memories;
CREATE TRIGGER trigger_decrement_topic_usage
  AFTER DELETE ON memories
  FOR EACH ROW
  EXECUTE FUNCTION decrement_topic_usage_count();

DROP TRIGGER IF EXISTS trigger_update_topic_usage ON memories;
CREATE TRIGGER trigger_update_topic_usage
  AFTER UPDATE ON memories
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_usage_count();

-- ============================================
-- 6. Run initial sync to fix existing data
-- ============================================
SELECT sync_all_topic_usage_counts();

-- ============================================
-- DONE!
-- ============================================
-- Now usage_count will automatically:
-- - Increment when a memory is created with a topic_id
-- - Decrement when a memory with a topic_id is deleted
-- - Adjust when a memory's topic_id is changed
--
-- To manually verify/fix counts anytime, run:
--   SELECT sync_all_topic_usage_counts();
