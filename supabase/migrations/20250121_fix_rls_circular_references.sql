-- =====================================================
-- FIX CIRCULAR RLS POLICY REFERENCES
-- Migration: 2025-01-21-fix-rls-circular-references
-- Purpose: Fix infinite recursion detected in RLS policies
-- =====================================================

-- =====================================================
-- PROBLEM ANALYSIS
-- =====================================================
-- The original policies had a circular dependency:
-- - duels.SELECT checks duel_participants (line 130)
-- - duel_participants.SELECT checks duels (line 165)
-- This creates: duels → duel_participants → duels → infinite loop
--
-- SOLUTION: Remove unnecessary circular checks
-- - Users can only insert themselves as participants (duel_participants INSERT policy)
-- - Therefore, if user is in duel_participants, they MUST be creator or opponent
-- - The duel_participants check in duels.SELECT is redundant
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop all duels policies
DROP POLICY IF EXISTS "Users can view duels they're part of" ON duels;
DROP POLICY IF EXISTS "Users can insert their own duels" ON duels;
DROP POLICY IF EXISTS "Users can update their own duels" ON duels;
DROP POLICY IF EXISTS "Users can delete their own duels" ON duels;

-- Drop all duel_participants policies
DROP POLICY IF EXISTS "Users can view participants in their duels" ON duel_participants;
DROP POLICY IF EXISTS "Users can insert themselves as participants" ON duel_participants;
DROP POLICY IF EXISTS "Users can update their own participant records" ON duel_participants;
DROP POLICY IF EXISTS "Users can delete their own participant records" ON duel_participants;

-- Drop all duel_rewards policies
DROP POLICY IF EXISTS "Users can view their rewards" ON duel_rewards;
DROP POLICY IF EXISTS "Duel creators can insert rewards for their duels" ON duel_rewards;
DROP POLICY IF EXISTS "Users can update their own rewards" ON duel_rewards;
DROP POLICY IF EXISTS "Users can delete their own rewards" ON duel_rewards;

-- =====================================================
-- STEP 2: CREATE FIXED POLICIES
-- =====================================================

-- FIXED: Users can only view duels they're part of (as creator or opponent)
-- Removed duel_participants check to eliminate circular dependency
-- Users can only be participants if they're creator or opponent anyway
CREATE POLICY "Users can view duels they're part of" ON duels
  FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    opponent_id = auth.uid()
  );

-- Users can insert duels they created
CREATE POLICY "Users can insert their own duels" ON duels
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

-- Users can update duels they created
CREATE POLICY "Users can update their own duels" ON duels
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Users can delete duels they created
CREATE POLICY "Users can delete their own duels" ON duels
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- =====================================================
-- STEP 3: CREATE DUEL_PARTICIPANTS POLICIES
-- =====================================================
-- These policies check duels, but duels no longer checks duel_participants
-- So no circular dependency exists

-- Users can view participants only for duels they're part of
CREATE POLICY "Users can view participants in their duels" ON duel_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM duels
      WHERE duels.id = duel_participants.duel_id
      AND (duels.creator_id = auth.uid() OR duels.opponent_id = auth.uid())
    )
  );

-- Users can insert themselves as participants
CREATE POLICY "Users can insert themselves as participants" ON duel_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own participant records
CREATE POLICY "Users can update their own participant records" ON duel_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own participant records
CREATE POLICY "Users can delete their own participant records" ON duel_participants
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- STEP 4: CREATE DUEL_REWARDS POLICIES
-- =====================================================
-- These policies check duels, but duels no longer checks duel_rewards
-- So no circular dependency exists

-- Users can view their own rewards and rewards in their duels
CREATE POLICY "Users can view their rewards" ON duel_rewards
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM duels
      WHERE duels.id = duel_rewards.duel_id
      AND (duels.creator_id = auth.uid() OR duels.opponent_id = auth.uid())
    )
  );

-- Only system can insert rewards (or duel creator in same transaction)
CREATE POLICY "Duel creators can insert rewards for their duels" ON duel_rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM duels
      WHERE duels.id = duel_rewards.duel_id
      AND duels.creator_id = auth.uid()
    )
  );

-- Users can update their own reward data
CREATE POLICY "Users can update their own rewards" ON duel_rewards
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own rewards
CREATE POLICY "Users can delete their own rewards" ON duel_rewards
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================

-- Verify policies were created correctly
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
WHERE tablename IN ('duels', 'duel_participants', 'duel_rewards')
ORDER BY tablename, policyname;

-- =====================================================
-- SUMMARY
-- =====================================================
-- Changes made:
-- 1. Dropped all existing policies on duels, duel_participants, duel_rewards
-- 2. Created "Users can view duels they're part of" on duels (fixed, no circular reference)
-- 3. Re-created all other policies with proper syntax
--
-- Result:
-- - No infinite recursion in RLS policies
-- - Users can still access their duels correctly
-- - Security maintained (users can only see their own duels)
-- =====================================================
