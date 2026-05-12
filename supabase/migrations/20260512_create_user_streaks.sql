-- =====================================================
-- CREATE USER_STREAKS TABLE
-- Migration: 20260512_create_user_streaks
-- Purpose: Track user activity streaks (consecutive days)
-- =====================================================

-- Create user_streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_active_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create unique constraint on user_id (one record per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

-- Create index on last_active_date for querying streaks
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_active_date ON user_streaks(last_active_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on user_streaks table
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Users can read their own streak records
CREATE POLICY "Users can read their own streaks"
  ON user_streaks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own streak records
CREATE POLICY "Users can insert their own streaks"
  ON user_streaks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own streak records
CREATE POLICY "Users can update their own streaks"
  ON user_streaks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own streak records
CREATE POLICY "Users can delete their own streaks"
  ON user_streaks
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- TRIGGER: UPDATE updated_at TIMESTAMP
-- =====================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify table was created
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_streaks'
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_streaks';

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
WHERE tablename = 'user_streaks';

-- =====================================================
-- SUMMARY
-- =====================================================
-- Changes made:
-- 1. Created user_streaks table with all required columns
-- 2. Added unique constraint on user_id
-- 3. Added index on last_active_date for performance
-- 4. Enabled RLS and created policies for CRUD operations
-- 5. Added trigger to automatically update updated_at
--
-- Result:
-- - Table is ready to store user streak data
-- - Security enforced via RLS policies
-- - Automatic timestamp updates
-- =====================================================
