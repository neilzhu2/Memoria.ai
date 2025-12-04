-- Add topic_id to memories table
-- This allows us to link memories with the recording topics they were created from
-- Created: December 3, 2025

ALTER TABLE memories
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES recording_topics(id) ON DELETE SET NULL;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_memories_topic_id ON memories(topic_id);

-- Optionally backfill existing memories by looking up from user_topic_history
-- This finds memories that have a corresponding entry in user_topic_history and sets the topic_id
UPDATE memories m
SET topic_id = uth.topic_id
FROM user_topic_history uth
WHERE m.id = uth.memory_id
  AND m.topic_id IS NULL
  AND uth.was_used = true;
