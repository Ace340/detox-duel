-- Fix Friends Search RLS Policies for Detox Duel
-- This script adds missing RLS policies to enable friends search functionality

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Anyone can view focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Anyone can insert focus sessions" ON focus_sessions;

-- USERS TABLE RLS POLICIES
-- Enable users to be searchable by authenticated users
CREATE POLICY "Users can read all users" ON users
  FOR SELECT
  USING (true);

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- FOCUS SESSIONS TABLE RLS POLICIES
-- Allow authenticated users to read all focus sessions (for leaderboard)
CREATE POLICY "Users can read all focus sessions" ON focus_sessions
  FOR SELECT
  USING (true);

-- Allow users to insert their own focus sessions
CREATE POLICY "Users can insert their own focus sessions" ON focus_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own focus sessions
CREATE POLICY "Users can update their own focus sessions" ON focus_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own focus sessions
CREATE POLICY "Users can delete their own focus sessions" ON focus_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verify policies are set up correctly
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('users', 'focus_sessions')
ORDER BY tablename, policyname;

-- Test: Create a test user to verify insertion works
-- Note: This will only work if auth.uid() is set (authenticated user)
-- For testing in SQL Editor, you'll need to be authenticated
