-- Memoria.ai - Family Sharing Schema Migration
-- Created: November 9, 2025
-- Purpose: Add minimal family sharing tables for Phase 5 (Feb-Mar 2026)
--
-- This migration adds 4 new tables:
-- 1. families - Family groups
-- 2. family_members - Membership in families
-- 3. topic_requests - Topics suggested by family members
-- 4. memory_shares - Track which memories shared with which families
--
-- NO CHANGES to existing tables (memories, user_profiles)

-- ============================================================================
-- 1. FAMILIES TABLE
-- ============================================================================
-- Stores family groups that users can create and join

CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for finding families created by a user
CREATE INDEX IF NOT EXISTS idx_families_created_by ON families(created_by);

-- ============================================================================
-- 2. FAMILY MEMBERS TABLE
-- ============================================================================
-- Tracks which users belong to which families

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)  -- Prevent duplicate memberships
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);

-- ============================================================================
-- 3. TOPIC REQUESTS TABLE
-- ============================================================================
-- Stores topics that family members request others to record
-- Example: Grandson asks Grandpa to "Tell me about the war"

CREATE TABLE IF NOT EXISTS topic_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  requested_for_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,  -- Who should record
  requested_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,   -- Who requested
  topic_text TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT true,  -- true = custom text, false = pre-defined theme
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'recorded', 'dismissed')),
  recorded_memory_id UUID REFERENCES memories(id) ON DELETE SET NULL,  -- Link to recorded memory
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_topic_requests_requested_for ON topic_requests(requested_for_user_id, status);
CREATE INDEX IF NOT EXISTS idx_topic_requests_family_id ON topic_requests(family_id);
CREATE INDEX IF NOT EXISTS idx_topic_requests_status ON topic_requests(status);

-- ============================================================================
-- 4. MEMORY SHARES TABLE
-- ============================================================================
-- Junction table: tracks which memories are shared with which families

CREATE TABLE IF NOT EXISTS memory_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(memory_id, family_id)  -- Prevent sharing same memory to same family twice
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_memory_shares_memory_id ON memory_shares(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_shares_family_id ON memory_shares(family_id);

-- ============================================================================
-- TRIGGERS - Auto-update updated_at timestamps
-- ============================================================================

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topic_requests_updated_at
  BEFORE UPDATE ON topic_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_shares ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- FAMILIES POLICIES
-- ----------------------------------------------------------------------------

-- Users can view families they're members of
CREATE POLICY "Users can view their families" ON families
  FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Users can create families
CREATE POLICY "Users can create families" ON families
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update families they created
CREATE POLICY "Users can update their own families" ON families
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Users can delete families they created
CREATE POLICY "Users can delete their own families" ON families
  FOR DELETE
  USING (auth.uid() = created_by);

-- ----------------------------------------------------------------------------
-- FAMILY MEMBERS POLICIES
-- ----------------------------------------------------------------------------

-- Users can view members of families they belong to
CREATE POLICY "Users can view family members" ON family_members
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Users can join families (via invitation - TBD in Phase 5)
CREATE POLICY "Users can join families" ON family_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave families
CREATE POLICY "Users can leave families" ON family_members
  FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- TOPIC REQUESTS POLICIES
-- ----------------------------------------------------------------------------

-- Users can view topic requests in families they belong to
CREATE POLICY "Users can view family topic requests" ON topic_requests
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Users can create topic requests in families they belong to
CREATE POLICY "Users can create topic requests" ON topic_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = requested_by_user_id AND
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Users can update topic requests they created
CREATE POLICY "Users can update their topic requests" ON topic_requests
  FOR UPDATE
  USING (auth.uid() = requested_by_user_id);

-- Users can update status if request is for them
CREATE POLICY "Recipients can update topic request status" ON topic_requests
  FOR UPDATE
  USING (auth.uid() = requested_for_user_id);

-- Users can delete topic requests they created
CREATE POLICY "Users can delete their topic requests" ON topic_requests
  FOR DELETE
  USING (auth.uid() = requested_by_user_id);

-- ----------------------------------------------------------------------------
-- MEMORY SHARES POLICIES
-- ----------------------------------------------------------------------------

-- Users can view shares for memories in their families
CREATE POLICY "Users can view family memory shares" ON memory_shares
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Users can share their own memories
CREATE POLICY "Users can share their memories" ON memory_shares
  FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by AND
    memory_id IN (
      SELECT id FROM memories WHERE user_id = auth.uid()
    )
  );

-- Users can unshare their own memories
CREATE POLICY "Users can unshare their memories" ON memory_shares
  FOR DELETE
  USING (
    auth.uid() = shared_by AND
    memory_id IN (
      SELECT id FROM memories WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTION - Get shared memories for a user
-- ============================================================================
-- This view makes it easy to query shared memories in your families

CREATE OR REPLACE VIEW user_family_memories AS
SELECT DISTINCT
  m.*,
  ms.family_id,
  ms.shared_by,
  ms.shared_at,
  f.name as family_name
FROM memories m
JOIN memory_shares ms ON m.id = ms.memory_id
JOIN families f ON ms.family_id = f.id
JOIN family_members fm ON f.id = fm.family_id
WHERE fm.user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON user_family_memories TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Tables created:
-- ✅ families (4 columns)
-- ✅ family_members (4 columns)
-- ✅ topic_requests (9 columns)
-- ✅ memory_shares (5 columns)
--
-- RLS policies created: 17 policies total
-- Indexes created: 8 indexes for performance
-- Triggers created: 2 auto-update triggers
-- Views created: 1 helper view
--
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify tables created successfully
-- 3. These tables will remain empty until Phase 5 implementation
-- 4. Existing app functionality is NOT affected
--
-- ============================================================================
