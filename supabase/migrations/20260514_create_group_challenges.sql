-- =====================================================
-- CREATE GROUP CHALLENGES SYSTEM
-- Migration: 20260514_create_group_challenges
-- Purpose: Create tables for multi-user challenges with automatic status management
-- =====================================================

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Drop existing enums if they exist (for migration purposes)
DROP TYPE IF EXISTS challenge_type CASCADE;
DROP TYPE IF EXISTS challenge_status CASCADE;

-- Create challenge type enumeration
CREATE TYPE challenge_type AS ENUM (
  'lowest_screen_time',
  'most_focus_sessions',
  'longest_streak'
);

-- Create challenge status enumeration
CREATE TYPE challenge_status AS ENUM (
  'pending',
  'active',
  'completed'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Drop existing tables if they exist (for migration purposes)
DROP TABLE IF EXISTS group_challenge_participants CASCADE;
DROP TABLE IF EXISTS group_challenges CASCADE;

-- Create group_challenges table: Stores main challenge information
CREATE TABLE group_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type challenge_type NOT NULL,
  target_metric FLOAT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status challenge_status NOT NULL DEFAULT 'pending',
  max_participants INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure end_date is after start_date
  CONSTRAINT valid_date_range CHECK (end_date > start_date),

  -- Challenge duration cannot exceed 7 days
  CONSTRAINT max_challenge_duration CHECK (end_date - start_date <= INTERVAL '7 days'),

  -- Minimum of 2 participants required
  CONSTRAINT min_participants CHECK (max_participants >= 2)
);

-- Create group_challenge_participants table: Tracks user participation in challenges
CREATE TABLE group_challenge_participants (
  challenge_id UUID NOT NULL REFERENCES group_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score FLOAT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (challenge_id, user_id),

  -- Score cannot be negative
  CONSTRAINT valid_score CHECK (score >= 0)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Improve query performance for common access patterns on group_challenges
CREATE INDEX idx_group_challenges_creator_id ON group_challenges(creator_id);
CREATE INDEX idx_group_challenges_status ON group_challenges(status);
CREATE INDEX idx_group_challenges_start_date ON group_challenges(start_date);
CREATE INDEX idx_group_challenges_type ON group_challenges(challenge_type);

-- Improve query performance for common access patterns on group_challenge_participants
CREATE INDEX idx_group_participants_user_id ON group_challenge_participants(user_id);
CREATE INDEX idx_group_participants_challenge_id ON group_challenge_participants(challenge_id);
CREATE INDEX idx_group_participants_score ON group_challenge_participants(score DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE group_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_challenge_participants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- GROUP_CHALLENGES TABLE RLS POLICIES
-- =====================================================

-- Users can view challenges they created or are participating in
CREATE POLICY "Users can view their challenges" ON group_challenges
  FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_challenge_participants
      WHERE group_challenge_participants.challenge_id = group_challenges.id
      AND group_challenge_participants.user_id = auth.uid()
    )
  );

-- Users can insert challenges they created
CREATE POLICY "Users can insert their own challenges" ON group_challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

-- Users can update challenges they created
CREATE POLICY "Users can update their own challenges" ON group_challenges
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Users can delete challenges they created
CREATE POLICY "Users can delete their own challenges" ON group_challenges
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- =====================================================
-- GROUP_CHALLENGE_PARTICIPANTS TABLE RLS POLICIES
-- =====================================================

-- Users can view participants only in challenges they created or are participating in
CREATE POLICY "Users can view participants in their challenges" ON group_challenge_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_challenges
      WHERE group_challenges.id = group_challenge_participants.challenge_id
      AND (group_challenges.creator_id = auth.uid() OR
           EXISTS (
             SELECT 1 FROM group_challenge_participants gcp
             WHERE gcp.challenge_id = group_challenge_participants.challenge_id
             AND gcp.user_id = auth.uid()
           ))
    )
  );

-- Users can insert participants for challenges they created
CREATE POLICY "Challenge creators can insert participants" ON group_challenge_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_challenges
      WHERE group_challenges.id = group_challenge_participants.challenge_id
      AND group_challenges.creator_id = auth.uid()
    )
  );

-- Users can update their own participant records
CREATE POLICY "Users can update their own participant records" ON group_challenge_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own participant records
CREATE POLICY "Users can delete their own participant records" ON group_challenge_participants
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on group_challenges
CREATE TRIGGER update_group_challenges_updated_at
  BEFORE UPDATE ON group_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically activate challenges when start_date is reached
CREATE OR REPLACE FUNCTION update_challenge_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If challenge is pending and start_date has passed, set to active
  IF NEW.status = 'pending' AND NEW.start_date <= NOW() THEN
    NEW.status = 'active';
  END IF;

  -- If challenge is active or pending and end_date has passed, set to completed
  IF NEW.status IN ('pending', 'active') AND NEW.end_date <= NOW() THEN
    NEW.status = 'completed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update challenge status based on dates
CREATE TRIGGER update_challenge_status_trigger
  BEFORE INSERT OR UPDATE ON group_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_status();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify enums were created
SELECT
  typname AS enum_name,
  enumlabel AS enum_value
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname IN ('challenge_type', 'challenge_status')
ORDER BY typname, enumsortorder;

-- Verify group_challenges table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'group_challenges'
ORDER BY ordinal_position;

-- Verify group_challenge_participants table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'group_challenge_participants'
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('group_challenges', 'group_challenge_participants')
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
WHERE tablename IN ('group_challenges', 'group_challenge_participants')
ORDER BY tablename, policyname;

-- Verify constraints were created
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid IN ('group_challenges'::regclass, 'group_challenge_participants'::regclass)
ORDER BY conrelid::regclass::text, conname;

-- Verify triggers were created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('group_challenges', 'group_challenge_participants')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- SUMMARY
-- =====================================================
-- Changes made:
-- 1. Created enum types: challenge_type (3 values), challenge_status (3 values)
-- 2. Created group_challenges table with:
--    - Primary key: id (UUID)
--    - Foreign key: creator_id references auth.users
--    - Fields: title, description, challenge_type, target_metric, start_date, end_date, status, max_participants
--    - Timestamps: created_at, updated_at
--    - Constraints: valid_date_range, max_challenge_duration, min_participants
-- 3. Created group_challenge_participants table with:
--    - Composite primary key: (challenge_id, user_id)
--    - Foreign keys: challenge_id references group_challenges, user_id references auth.users
--    - Fields: score, joined_at
--    - Constraint: valid_score
-- 4. Created indexes:
--    - group_challenges: creator_id, status, start_date, challenge_type
--    - group_challenge_participants: user_id, challenge_id, score (DESC)
-- 5. Enabled RLS on both tables with comprehensive policies
-- 6. Created triggers:
--    - update_updated_at_column: Auto-updates timestamps
--    - update_challenge_status: Auto-activates and auto-completes challenges
-- 7. Added verification queries for all schema components
--
-- Result:
-- - Database schema ready for group challenges feature
-- - Automatic status management based on dates
-- - Security enforced via RLS policies
-- - Performance optimized with strategic indexes
-- - Idempotent migration with IF EXISTS drop statements
-- =====================================================
