-- =====================================================
-- ADD POINTS SYSTEM
-- Migration: 20240514_add_points_system
-- Purpose: Create user_points and point_transactions tables for gamification
-- =====================================================

-- =====================================================
-- CREATE USER_POINTS TABLE
-- =====================================================
-- Tracks total points for each user
-- One record per user, created when user earns their first points

CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_points BIGINT NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- CREATE POINT_TRANSACTIONS TABLE
-- =====================================================
-- Transaction log for all point awards/deductions
-- Immutable record of how points were earned or lost

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  -- Valid reasons: 'session_complete', 'duel_win', 'streak_milestone', 'friend_added', 'badge_earned'
  related_duel_id UUID REFERENCES duels(id) ON DELETE SET NULL,
  related_session_id UUID REFERENCES focus_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- ADD TOTAL_POINTS COLUMN TO USERS TABLE
-- =====================================================
-- Add denormalized column for quick access to user's total points
-- This is updated via triggers to stay in sync with user_points table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS total_points BIGINT DEFAULT 0;

-- =====================================================
-- INDEXES
-- =====================================================

-- Index on user_points.user_id for quick lookup of user's points
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);

-- Index on user_points.total_points for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_points_total_points ON user_points(total_points DESC);

-- Index on point_transactions.user_id for fetching user's transaction history
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);

-- Index on point_transactions.user_id and created_at for recent transactions
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id_created_at ON point_transactions(user_id, created_at DESC);

-- Index on users.total_points for leaderboard queries (using denormalized column)
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on user_points table
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Enable RLS on point_transactions table
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER_POINTS TABLE RLS POLICIES
-- =====================================================

-- Users can read their own points
CREATE POLICY "Users can read their own points"
  ON user_points
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users CANNOT insert points directly (prevents cheating)
-- Points must be awarded via database functions with proper validation

-- Users CANNOT update points directly (prevents cheating)
-- Points must be updated via database functions with proper validation

-- Users CANNOT delete their points (prevents data loss)

-- Service role can insert points (for awarding via backend functions)
CREATE POLICY "Service role can insert points"
  ON user_points
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can update points (for awarding via backend functions)
CREATE POLICY "Service role can update points"
  ON user_points
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role can delete points (for data cleanup)
CREATE POLICY "Service role can delete points"
  ON user_points
  FOR DELETE
  TO service_role
  USING (true);

-- =====================================================
-- POINT_TRANSACTIONS TABLE RLS POLICIES
-- =====================================================

-- Users can read their own transactions
CREATE POLICY "Users can read their own transactions"
  ON point_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users CANNOT insert transactions directly (prevents cheating)
-- Transactions must be created via database functions with proper validation

-- Users CANNOT update transactions (immutable record)
-- Transactions are immutable to prevent tampering with history

-- Users CANNOT delete transactions (immutable record)
-- Transactions are immutable to prevent tampering with history

-- Service role can insert transactions (for awarding via backend functions)
CREATE POLICY "Service role can insert transactions"
  ON point_transactions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can read all transactions
CREATE POLICY "Service role can read all transactions"
  ON point_transactions
  FOR SELECT
  TO service_role
  USING (true);

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

-- Create trigger to automatically update updated_at on user_points table
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: SYNC TOTAL_POINTS TO USERS TABLE
-- =====================================================
-- Keep users.total_points in sync with user_points.total_points
-- This provides a denormalized column for quick leaderboard queries

CREATE OR REPLACE FUNCTION sync_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync to users table when user_points is updated
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    UPDATE users
    SET total_points = NEW.total_points,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reset to 0 when user_points record is deleted
    UPDATE users
    SET total_points = 0,
        updated_at = NOW()
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync total_points to users table
CREATE TRIGGER sync_total_points_to_users
  AFTER INSERT OR UPDATE OR DELETE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_total_points();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify user_points table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_points'
ORDER BY ordinal_position;

-- Verify point_transactions table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'point_transactions'
ORDER BY ordinal_position;

-- Verify total_points column added to users table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'total_points';

-- Verify indexes were created
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_points', 'point_transactions', 'users')
  AND indexname LIKE '%points%'
ORDER BY tablename, indexname;

-- Verify RLS policies were created for user_points
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
WHERE tablename = 'user_points'
ORDER BY policyname;

-- Verify RLS policies were created for point_transactions
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
WHERE tablename = 'point_transactions'
ORDER BY policyname;

-- Verify triggers were created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%points%'
  OR trigger_name LIKE '%sync_total_points%'
ORDER BY trigger_name;

-- Verify check constraints on user_points
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_points'::regclass
  AND contype = 'c';

-- Verify check constraints on point_transactions
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'point_transactions'::regclass
  AND contype = 'c';

-- =====================================================
-- SUMMARY
-- =====================================================
-- Changes made:
-- 1. Created user_points table with id, user_id, total_points, timestamps
-- 2. Created point_transactions table with id, user_id, amount, reason, related_ids, timestamps
-- 3. Added total_points column to users table (denormalized for performance)
-- 4. Added CHECK constraints: total_points >= 0, amount > 0
-- 5. Created indexes for optimized queries: user_points(user_id), user_points(total_points DESC),
--    point_transactions(user_id), point_transactions(user_id, created_at DESC), users(total_points DESC)
-- 6. Enabled RLS on both tables with appropriate security policies
-- 7. RLS policies prevent users from modifying their own points directly (security)
-- 8. RLS policies allow users to read their own points and transactions
-- 9. Service role can award points via policies (backend functions)
-- 10. Added trigger to automatically update updated_at on user_points
-- 11. Added trigger to sync total_points from user_points to users table (denormalization)
--
-- Security:
-- - Users can only READ their own points and transactions
-- - Users CANNOT INSERT, UPDATE, or DELETE points or transactions directly
-- - Points must be awarded via database functions (to be created in separate migration)
-- - Service role has full access for backend operations
--
-- Performance:
-- - Denormalized total_points in users table for fast leaderboard queries
-- - Automatic sync via triggers ensures data consistency
-- - Strategic indexes on frequently queried columns
--
-- Valid reason values for point_transactions:
-- - 'session_complete' - Points earned for completing a focus session
-- - 'duel_win' - Points earned for winning a duel
-- - 'streak_milestone' - Bonus points for hitting streak milestones
-- - 'friend_added' - Points for adding a friend
-- - 'badge_earned' - Points for earning badges
--
-- Result:
-- - Database schema is ready for points-based gamification
-- - Security enforced via RLS policies (prevents cheating)
-- - Performance optimized with strategic indexes and denormalization
-- - Audit trail via point_transactions table
-- - Automatic timestamp updates and total_points sync
-- =====================================================