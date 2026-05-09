-- Migration: Fix notifications table RLS policies
-- Purpose: Allow duel challenges, friend requests, and other user-to-user notifications
-- Date: 2025-05-09

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

-- Create RLS policies for notifications table

-- SELECT: Users can only read their own notifications
CREATE POLICY "notifications_select_policy"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Authenticated users can insert notifications for any user
-- This is required for:
-- - Duel challenges (creator sends to opponent)
-- - Friend requests (sender sends to recipient)
-- - Friend acceptances (accepter sends to sender)
CREATE POLICY "notifications_insert_policy"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Users can only update their own notifications (mark as read, etc.)
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
