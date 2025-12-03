-- Topics System Database Schema
-- Phase 1: Curated Topics Library with Category Filtering
-- Created: December 2, 2025

-- ============================================
-- 1. Categories Table
-- ============================================
CREATE TABLE IF NOT EXISTS topic_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Topics Table
-- ============================================
CREATE TABLE IF NOT EXISTS recording_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES topic_categories(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'deep')),
  tags TEXT[], -- for future filtering/search
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0, -- track popularity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. User Topic History Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_topic_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES recording_topics(id) ON DELETE CASCADE,
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  was_used BOOLEAN DEFAULT false, -- did user record with this topic?
  memory_id UUID REFERENCES memories(id) ON DELETE SET NULL,
  UNIQUE(user_id, topic_id, shown_at)
);

-- ============================================
-- 4. Indexes for Performance
-- ============================================
CREATE INDEX idx_topics_category ON recording_topics(category_id);
CREATE INDEX idx_topics_active ON recording_topics(is_active);
CREATE INDEX idx_user_history_user ON user_topic_history(user_id);
CREATE INDEX idx_user_history_shown_at ON user_topic_history(shown_at DESC);
CREATE INDEX idx_user_history_topic ON user_topic_history(topic_id);

-- ============================================
-- 5. Row Level Security (RLS)
-- ============================================

-- Categories: Public read access
ALTER TABLE topic_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON topic_categories
  FOR SELECT USING (is_active = true);

-- Topics: Public read access
ALTER TABLE recording_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active topics" ON recording_topics
  FOR SELECT USING (is_active = true);

-- User History: Users can only see their own history
ALTER TABLE user_topic_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topic history" ON user_topic_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic history" ON user_topic_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic history" ON user_topic_history
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 6. Seed Data: Categories
-- ============================================
INSERT INTO topic_categories (name, display_name, description, icon, sort_order) VALUES
  ('childhood', 'Childhood', 'Early life memories and family', '👶', 1),
  ('family', 'Family', 'Parents, siblings, relatives', '👨‍👩‍👧‍👦', 2),
  ('career', 'Career', 'Work life and professional journey', '💼', 3),
  ('relationships', 'Relationships', 'Love, friendship, connections', '❤️', 4),
  ('travel', 'Travel', 'Places visited and adventures', '✈️', 5),
  ('hobbies', 'Hobbies', 'Passions and interests', '🎨', 6),
  ('achievements', 'Achievements', 'Proud moments and milestones', '🏆', 7),
  ('challenges', 'Challenges', 'Difficult times and lessons learned', '💪', 8),
  ('wisdom', 'Wisdom', 'Life advice and reflections', '💡', 9),
  ('daily', 'Daily Life', 'Everyday moments and routines', '☀️', 10)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 7. Sample Topics (50 initial topics)
-- ============================================
-- We'll add 250 topics in the next step, but here are 50 to start

-- Childhood (5 topics)
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What is your earliest childhood memory?', 'easy', ARRAY['first memory', 'childhood']
FROM topic_categories WHERE name = 'childhood';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about your favorite childhood toy or game.', 'easy', ARRAY['toys', 'play', 'childhood']
FROM topic_categories WHERE name = 'childhood';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What was your childhood home like?', 'medium', ARRAY['home', 'house', 'childhood']
FROM topic_categories WHERE name = 'childhood';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Describe a typical day when you were a child.', 'medium', ARRAY['daily routine', 'childhood']
FROM topic_categories WHERE name = 'childhood';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What was your relationship with your siblings like growing up?', 'deep', ARRAY['siblings', 'relationships', 'childhood']
FROM topic_categories WHERE name = 'childhood';

-- Family (5 topics)
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about your mother. What was she like?', 'deep', ARRAY['mother', 'parent']
FROM topic_categories WHERE name = 'family';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about your father. What was he like?', 'deep', ARRAY['father', 'parent']
FROM topic_categories WHERE name = 'family';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What family traditions did you have growing up?', 'medium', ARRAY['traditions', 'culture']
FROM topic_categories WHERE name = 'family';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about a memorable family vacation.', 'easy', ARRAY['vacation', 'travel']
FROM topic_categories WHERE name = 'family';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What are some funny stories about your grandparents?', 'easy', ARRAY['grandparents', 'humor']
FROM topic_categories WHERE name = 'family';

-- Career (5 topics)
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What was your first job? What did you learn from it?', 'easy', ARRAY['first job', 'work']
FROM topic_categories WHERE name = 'career';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about a mentor who influenced your career.', 'medium', ARRAY['mentor', 'influence']
FROM topic_categories WHERE name = 'career';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What was your proudest professional achievement?', 'medium', ARRAY['achievement', 'success']
FROM topic_categories WHERE name = 'career';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Describe a challenging project you worked on.', 'deep', ARRAY['challenge', 'project']
FROM topic_categories WHERE name = 'career';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'If you could give career advice to your younger self, what would it be?', 'deep', ARRAY['advice', 'wisdom']
FROM topic_categories WHERE name = 'career';

-- Relationships (5 topics)
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'How did you meet your spouse/partner?', 'easy', ARRAY['love', 'meeting']
FROM topic_categories WHERE name = 'relationships';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about your best friend. How did you meet?', 'easy', ARRAY['friendship', 'meeting']
FROM topic_categories WHERE name = 'relationships';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What is the most important thing you learned about love?', 'deep', ARRAY['love', 'wisdom']
FROM topic_categories WHERE name = 'relationships';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Describe a time when a friendship changed your life.', 'medium', ARRAY['friendship', 'impact']
FROM topic_categories WHERE name = 'relationships';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What advice would you give about maintaining relationships?', 'deep', ARRAY['advice', 'wisdom']
FROM topic_categories WHERE name = 'relationships';

-- Travel (5 topics)
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What was your most memorable trip? Why?', 'easy', ARRAY['favorite', 'adventure']
FROM topic_categories WHERE name = 'travel';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about a place you visited that surprised you.', 'medium', ARRAY['surprise', 'discovery']
FROM topic_categories WHERE name = 'travel';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Describe a travel mishap that turned into a good story.', 'easy', ARRAY['mishap', 'humor']
FROM topic_categories WHERE name = 'travel';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'If you could travel anywhere, where would you go and why?', 'medium', ARRAY['dreams', 'wishes']
FROM topic_categories WHERE name = 'travel';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about the people you met while traveling.', 'medium', ARRAY['people', 'connections']
FROM topic_categories WHERE name = 'travel';

-- Hobbies (5 topics)
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What hobbies have you enjoyed throughout your life?', 'easy', ARRAY['interests', 'passion']
FROM topic_categories WHERE name = 'hobbies';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about a skill you taught yourself.', 'medium', ARRAY['learning', 'skill']
FROM topic_categories WHERE name = 'hobbies';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What creative pursuits have brought you joy?', 'easy', ARRAY['creativity', 'joy']
FROM topic_categories WHERE name = 'hobbies';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Describe a time when your hobby connected you with others.', 'medium', ARRAY['community', 'connections']
FROM topic_categories WHERE name = 'hobbies';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What hobby would you like to pursue if you had more time?', 'easy', ARRAY['wishes', 'future']
FROM topic_categories WHERE name = 'hobbies';

-- Achievements (5 topics)
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What accomplishment are you most proud of?', 'medium', ARRAY['pride', 'success']
FROM topic_categories WHERE name = 'achievements';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about a time when you overcame a fear.', 'deep', ARRAY['fear', 'courage']
FROM topic_categories WHERE name = 'achievements';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Describe a goal you set and achieved.', 'medium', ARRAY['goals', 'success']
FROM topic_categories WHERE name = 'achievements';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What is something you did that surprised even yourself?', 'medium', ARRAY['surprise', 'growth']
FROM topic_categories WHERE name = 'achievements';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about a time you helped someone in a meaningful way.', 'deep', ARRAY['helping', 'impact']
FROM topic_categories WHERE name = 'achievements';

-- Challenges (5 topics)
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What was the most difficult period of your life?', 'deep', ARRAY['hardship', 'struggle']
FROM topic_categories WHERE name = 'challenges';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about a time when you failed but learned something important.', 'deep', ARRAY['failure', 'learning']
FROM topic_categories WHERE name = 'challenges';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'How did you cope during tough times?', 'deep', ARRAY['coping', 'resilience']
FROM topic_categories WHERE name = 'challenges';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What gave you strength when things were difficult?', 'deep', ARRAY['strength', 'support']
FROM topic_categories WHERE name = 'challenges';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Describe a challenge that made you stronger.', 'deep', ARRAY['growth', 'resilience']
FROM topic_categories WHERE name = 'challenges';

-- Wisdom (5 topics)
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What is the most important lesson life has taught you?', 'deep', ARRAY['life lessons', 'wisdom']
FROM topic_categories WHERE name = 'wisdom';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What advice would you give to your younger self?', 'deep', ARRAY['advice', 'reflection']
FROM topic_categories WHERE name = 'wisdom';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What values are most important to you and why?', 'deep', ARRAY['values', 'beliefs']
FROM topic_categories WHERE name = 'wisdom';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about someone who taught you an important life lesson.', 'medium', ARRAY['mentor', 'learning']
FROM topic_categories WHERE name = 'wisdom';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What do you wish more people understood about life?', 'deep', ARRAY['wisdom', 'perspective']
FROM topic_categories WHERE name = 'wisdom';

-- Daily Life (5 topics)
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What does a typical day look like for you now?', 'easy', ARRAY['routine', 'present']
FROM topic_categories WHERE name = 'daily';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Tell me about a small moment that made you happy recently.', 'easy', ARRAY['joy', 'gratitude']
FROM topic_categories WHERE name = 'daily';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What are you grateful for today?', 'easy', ARRAY['gratitude', 'appreciation']
FROM topic_categories WHERE name = 'daily';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'Describe your morning routine.', 'easy', ARRAY['routine', 'morning']
FROM topic_categories WHERE name = 'daily';

INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags)
SELECT id, 'What simple pleasures do you enjoy?', 'easy', ARRAY['joy', 'simple']
FROM topic_categories WHERE name = 'daily';

-- ============================================
-- 8. Helper Functions
-- ============================================

-- Function to get next topic for user (avoiding recently shown)
CREATE OR REPLACE FUNCTION get_next_topic_for_user(
  p_user_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_days_to_avoid INTEGER DEFAULT 30
) RETURNS TABLE (
  topic_id UUID,
  prompt TEXT,
  category_name TEXT,
  category_icon TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id as topic_id,
    t.prompt,
    c.display_name as category_name,
    c.icon as category_icon
  FROM recording_topics t
  JOIN topic_categories c ON t.category_id = c.id
  WHERE t.is_active = true
    AND c.is_active = true
    AND (p_category_id IS NULL OR t.category_id = p_category_id)
    AND t.id NOT IN (
      SELECT topic_id
      FROM user_topic_history
      WHERE user_id = p_user_id
        AND shown_at > NOW() - INTERVAL '1 day' * p_days_to_avoid
    )
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE! Ready to use.
-- ============================================
