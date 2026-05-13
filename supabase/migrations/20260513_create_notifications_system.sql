-- Migration: Update notifications table with full notification types and preferences
-- Date: 2026-05-13
-- Purpose: Complete notifications system with all types and user preferences

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Drop existing enum if it exists (for migration purposes)
DROP TYPE IF EXISTS notification_type CASCADE;

-- Create notification type enumeration
CREATE TYPE notification_type AS ENUM (
  'friend_request',
  'friend_accepted',
  'duel_challenge',
  'duel_result',
  'badge_earned',
  'streak_milestone',
  'weekly_summary'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Drop existing notifications table if it exists
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_from_user_id ON notifications(from_user_id) WHERE from_user_id IS NOT NULL;

-- Create notification preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  duel_challenges BOOLEAN NOT NULL DEFAULT true,
  duel_results BOOLEAN NOT NULL DEFAULT true,
  badges BOOLEAN NOT NULL DEFAULT true,
  streaks BOOLEAN NOT NULL DEFAULT true,
  weekly_summary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to insert notification (checks user preferences)
CREATE OR REPLACE FUNCTION insert_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title VARCHAR(255),
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_from_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_preferences notification_preferences;
  v_allowed BOOLEAN;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- If no preferences exist, create defaults
  IF v_preferences IS NULL THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  -- Check if notification type is allowed based on preferences
  v_allowed := false;
  CASE p_type
    WHEN 'duel_challenge' THEN v_allowed := v_preferences.duel_challenges;
    WHEN 'duel_result' THEN v_allowed := v_preferences.duel_results;
    WHEN 'badge_earned' THEN v_allowed := v_preferences.badges;
    WHEN 'streak_milestone' THEN v_allowed := v_preferences.streaks;
    WHEN 'weekly_summary' THEN v_allowed := v_preferences.weekly_summary;
    WHEN 'friend_request' THEN v_allowed := true; -- Always allow friend requests
  END CASE;

  -- Insert notification only if allowed
  IF v_allowed THEN
    INSERT INTO notifications (user_id, type, title, body, data, from_user_id)
    VALUES (p_user_id, p_type, p_title, p_body, p_data, p_from_user_id)
    RETURNING id INTO v_notification_id;
  END IF;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications RLS policies

-- SELECT: Users can only read their own notifications
CREATE POLICY "notifications_select_policy"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Authenticated users can insert notifications for any user (needed for challenges, etc.)
CREATE POLICY "notifications_insert_policy"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Users can only update their own notifications
CREATE POLICY "notifications_update_policy"
ON notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own notifications
CREATE POLICY "notifications_delete_policy"
ON notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Notification Preferences RLS policies

-- SELECT: Users can only read their own preferences
CREATE POLICY "notification_preferences_select_policy"
ON notification_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can insert their own preferences
CREATE POLICY "notification_preferences_insert_policy"
ON notification_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own preferences
CREATE POLICY "notification_preferences_update_policy"
ON notification_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own preferences
CREATE POLICY "notification_preferences_delete_policy"
ON notification_preferences
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- This will be handled by the application when creating notifications
