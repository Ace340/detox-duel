-- =====================================================
-- ADD CATEGORY TO FOCUS SESSIONS
-- Migration: 20260515_add_category_to_focus_sessions
-- Purpose: Add category column to focus_sessions table for categorizing focus time
-- =====================================================

-- =====================================================
-- COLUMN ADDITION
-- =====================================================

-- Add category column to focus_sessions table
ALTER TABLE focus_sessions
ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT NULL;

-- =====================================================
-- INDEXES
-- =====================================================

-- Create index for category to improve query performance
CREATE INDEX IF NOT EXISTS idx_focus_sessions_category ON focus_sessions(category);

-- Create composite index for category + user_id for efficient user-specific category queries
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_category ON focus_sessions(user_id, category);

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Add check constraint to ensure category is one of the predefined values (optional)
-- Note: We keep this as a comment since we want flexibility to add categories later
-- ALTER TABLE focus_sessions
-- ADD CONSTRAINT valid_category
-- CHECK (category IN ('Study', 'Work', 'Exercise', 'Reading', 'Meditation', 'Creative', 'Other'));

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify column was added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'focus_sessions'
  AND column_name = 'category';

-- Verify indexes were created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'focus_sessions'
  AND indexname LIKE '%category%'
ORDER BY indexname;

-- =====================================================
-- SUMMARY
-- =====================================================
-- Changes made:
-- 1. Added category column to focus_sessions table (VARCHAR(20), nullable)
-- 2. Created index on category for performance
-- 3. Created composite index on (user_id, category) for user-specific queries
--
-- Result:
-- - Focus sessions can now be categorized
-- - Category-based queries are optimized with indexes
-- - Flexible schema allows for adding new categories
-- =====================================================