-- =====================================================
-- CREATE BADGES SYSTEM
-- Migration: 20260512_create_badges_system
-- Purpose: Create badges and user_badges tables for achievement tracking
-- =====================================================

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  condition JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index on badges category for filtering badges
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);

-- Index on user_badges user_id for fetching user's badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- Index on user_badges user_id and earned_at for fetching recent badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id_earned_at ON user_badges(user_id, earned_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on badges table
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_badges table
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BADGES TABLE RLS POLICIES
-- =====================================================

-- Authenticated users can read badges (public reference data)
CREATE POLICY "Authenticated users can read badges"
  ON badges
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- USER_BADGES TABLE RLS POLICIES
-- =====================================================

-- Authenticated users can read their own badges
CREATE POLICY "Users can read their own badges"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can insert their own badges
CREATE POLICY "Users can insert their own badges"
  ON user_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own badges
CREATE POLICY "Users can delete their own badges"
  ON user_badges
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- TRIGGER: UPDATE updated_at TIMESTAMP
-- =====================================================

-- Create function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on badges table
CREATE TRIGGER update_badges_updated_at
  BEFORE UPDATE ON badges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED BADGES DATA
-- =====================================================

-- Focus Badges
INSERT INTO badges (name, emoji, description, category, condition) VALUES
('First Focus', '🎯', 'Complete your first focus session', 'focus', '{"sessions_completed": 1}'::jsonb),
('Dedicated', '💪', 'Complete 10 focus sessions', 'focus', '{"sessions_completed": 10}'::jsonb),
('Warrior', '🏆', 'Complete 50 focus sessions', 'focus', '{"sessions_completed": 50}'::jsonb);

-- Streak Badges
INSERT INTO badges (name, emoji, description, category, condition) VALUES
('On Fire', '🔥', 'Maintain a 3-day streak', 'streak', '{"streak_days": 3}'::jsonb),
('Unstoppable', '⚡', 'Maintain a 7-day streak', 'streak', '{"streak_days": 7}'::jsonb),
('Legendary', '👑', 'Maintain a 30-day streak', 'streak', '{"streak_days": 30}'::jsonb);

-- Duel Badges
INSERT INTO badges (name, emoji, description, category, condition) VALUES
('Champion', '🥇', 'Win your first duel', 'duel', '{"duels_won": 1}'::jsonb),
('Duel Master', '⚔️', 'Win 10 duels', 'duel', '{"duels_won": 10}'::jsonb);

-- Social Badges
INSERT INTO badges (name, emoji, description, category, condition) VALUES
('Social Butterfly', '🦋', 'Add 5 friends', 'social', '{"friends_added": 5}'::jsonb),
('Top 3', '🥈', 'Reach top 3 on leaderboard', 'social', '{"leaderboard_position": 3}'::jsonb);

-- Focus Time Badge
INSERT INTO badges (name, emoji, description, category, condition) VALUES
('100 Hours', '⏱️', 'Accumulate 100 hours of total focus time', 'focus', '{"focus_hours": 100}'::jsonb);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify badges table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'badges'
ORDER BY ordinal_position;

-- Verify user_badges table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_badges'
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('badges', 'user_badges')
ORDER BY tablename, indexname;

-- Verify RLS policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN substring(qual, 1, 100)
    ELSE NULL
  END as policy_logic
FROM pg_policies
WHERE tablename IN ('badges', 'user_badges')
ORDER BY tablename, policyname;

-- Verify badges were seeded
SELECT
  id,
  name,
  emoji,
  category,
  condition
FROM badges
ORDER BY category, name;

-- Verify unique constraint on user_badges
SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'user_badges'::regclass
  AND contype = 'u';

-- =====================================================
-- SUMMARY
-- =====================================================
-- Changes made:
-- 1. Created badges table with id, name, emoji, description, category, condition (jsonb), timestamps
-- 2. Created user_badges table with id, user_id, badge_id, earned_at
-- 3. Added unique constraint on user_badges(user_id, badge_id) to ensure one badge per user
-- 4. Created indexes: badges(category), user_badges(user_id), user_badges(user_id, earned_at)
-- 5. Enabled RLS on both tables with appropriate policies for authenticated users
-- 6. Added trigger to automatically update updated_at on badges table
-- 7. Seeded 11 badges across 4 categories (focus, streak, duel, social)
--
-- Badge Categories:
-- - Focus (4 badges): First Focus, Dedicated, Warrior, 100 Hours
-- - Streak (3 badges): On Fire, Unstoppable, Legendary
-- - Duel (2 badges): Champion, Duel Master
-- - Social (2 badges): Social Butterfly, Top 3
--
-- Result:
-- - Database tables are ready for badge tracking
-- - Security enforced via RLS policies
-- - Performance optimized with strategic indexes
-- - Automatic timestamp updates
-- - 11 badges pre-seeded with conditions stored as jsonb
-- =====================================================
