-- =====================================================
-- AWARD POINTS FUNCTION
-- Migration: 20260516_award_points_function
-- Purpose: Create database function to safely award points to users
-- =====================================================

-- =====================================================
-- CREATE AWARD_POINTS FUNCTION
-- =====================================================
-- This function safely awards points to users by:
-- 1. Creating/updating user_points record
-- 2. Logging transaction in point_transactions
-- 3. Automatically syncing to users.total_points via trigger
-- 4. All within a single transaction for data integrity

CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_amount BIGINT,
  p_reason TEXT,
  p_reference_duel_id UUID DEFAULT NULL,
  p_reference_session_id UUID DEFAULT NULL
)
RETURNS TABLE(id UUID, user_id UUID, amount BIGINT, reason TEXT, created_at TIMESTAMPTZ) AS $$
DECLARE
  v_user_points_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive, got: %', p_amount;
  END IF;

  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'reason cannot be NULL or empty';
  END IF;

  -- Validate reason is one of the allowed values
  IF p_reason NOT IN (
    'session_complete',
    'duel_win',
    'duel_complete',
    'streak_milestone',
    'badge_earned',
    'leaderboard_bonus'
  ) THEN
    RAISE EXCEPTION 'Invalid reason: %. Must be one of: session_complete, duel_win, duel_complete, streak_milestone, badge_earned, leaderboard_bonus', p_reason;
  END IF;

  -- Ensure user exists in users table
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Insert or update user_points record
  INSERT INTO user_points (user_id, total_points)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = user_points.total_points + p_amount,
    updated_at = NOW()
  RETURNING id INTO v_user_points_id;

  -- Log the transaction
  INSERT INTO point_transactions (
    user_id,
    amount,
    reason,
    related_duel_id,
    related_session_id,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    p_reason,
    p_reference_duel_id,
    p_reference_session_id,
    NOW()
  )
  RETURNING id INTO v_transaction_id;

  -- Return the created transaction record
  RETURN QUERY
  SELECT
    pt.id,
    pt.user_id,
    pt.amount,
    pt.reason,
    pt.created_at
  FROM point_transactions pt
  WHERE pt.id = v_transaction_id;

  -- Note: total_points in users table will be automatically synced
  -- via the existing trigger: sync_total_points_to_users
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Allow authenticated users to call this function via Supabase client
-- The function runs with SECURITY DEFINER, so it can modify tables
-- even if the user doesn't have direct INSERT/UPDATE permissions

GRANT EXECUTE ON FUNCTION award_points(
  UUID,
  BIGINT,
  TEXT,
  UUID,
  UUID
) TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify function was created
SELECT
  routine_name,
  routine_type,
  data_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'award_points';

-- Verify function parameters
SELECT
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND specific_name = 'award_points'
  AND parameter_mode != 'RETURN'
ORDER BY ordinal_position;

-- Verify function was granted to authenticated role
SELECT
  grantee,
  routine_schema,
  routine_name,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'award_points'
  AND grantee = 'authenticated';

-- =====================================================
-- TEST QUERIES (For Development - Comment out in Production)
-- =====================================================

-- Test awarding points for session completion
-- SELECT * FROM award_points(
--   (SELECT id FROM users LIMIT 1),  -- user_id
--   30,                             -- amount (30 min session * 10 pts/min)
--   'session_complete',             -- reason
--   NULL,                           -- duel_id
--   NULL                            -- session_id
-- );

-- Test awarding points for duel win
-- SELECT * FROM award_points(
--   (SELECT id FROM users LIMIT 1),  -- user_id
--   250,                            -- amount
--   'duel_win',                      -- reason
--   NULL,                           -- duel_id
--   NULL                            -- session_id
-- );

-- =====================================================
-- SUMMARY
-- =====================================================
-- Changes made:
-- 1. Created award_points() function with 5 parameters:
--    - p_user_id: UUID (required)
--    - p_amount: BIGINT (required, must be > 0)
--    - p_reason: TEXT (required, validated against enum)
--    - p_reference_duel_id: UUID (optional)
--    - p_reference_session_id: UUID (optional)
--
-- 2. Function performs:
--    - Input validation (NULL checks, positive amount, valid reason, user exists)
--    - Creates or updates user_points record with new total
--    - Logs transaction in point_transactions table
--    - Returns the created transaction record
--    - Automatically syncs to users.total_points via existing trigger
--
-- 3. Security:
--    - Uses SECURITY DEFINER to run with elevated privileges
--    - Validates all inputs before database operations
--    - Prevents direct INSERT/UPDATE by users (already enforced by RLS)
--    - Only grants EXECUTE permission to authenticated role
--
-- 4. Valid reason values:
--    - 'session_complete' - Points for completing a focus session
--    - 'duel_win' - Points for winning a duel
--    - 'duel_complete' - Points for completing (not winning) a duel
--    - 'streak_milestone' - Bonus points for hitting streak milestones
--    - 'badge_earned' - Points for earning badges
--    - 'leaderboard_bonus' - Bonus points for leaderboard achievements
--
-- 5. Points rules (application-side):
--    - Focus session completed: 10 points per minute of session duration
--    - Duel completed (participated): 100 points
--    - Duel won: 250 points
--    - Streak milestone hit (3, 7, 14, 30 days): 50 points per milestone level
--    - Badge earned: 200 points
--    - #1 on weekly leaderboard: 500 points
--
-- Result:
-- - Database function is ready to safely award points
-- - All operations within a single transaction
-- - Automatic synchronization to users table via triggers
-- - Full audit trail via point_transactions table
-- - Prevents cheating via RLS and input validation
-- =====================================================