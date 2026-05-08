-- Create Duel Feature Tables for Detox Duel
-- This migration creates tables for managing duels between users
-- Migration: 2025-01-21-create-duels-schema

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Duel type enumeration
CREATE TYPE duel_type AS ENUM (
  'focus_sprint',
  'weekly_war',
  'streak_battle',
  'quick_duel'
);

-- Duel status enumeration
CREATE TYPE duel_status AS ENUM (
  'pending',
  'active',
  'completed',
  'cancelled',
  'expired'
);

-- Reward type enumeration
CREATE TYPE reward_type AS ENUM (
  'streak_boost',
  'badge'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Duels table: Stores main duel information
CREATE TABLE duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duel_type duel_type NOT NULL,
  status duel_status NOT NULL DEFAULT 'pending',
  banned_apps JSONB DEFAULT '[]'::jsonb,
  duration_hours INTEGER NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure creator and opponent are different users
  CONSTRAINT creator_not_opponent CHECK (creator_id != opponent_id),

  -- Validation for duration
  CONSTRAINT valid_duration_hours CHECK (duration_hours > 0 AND duration_hours <= 168), -- Max 1 week

  -- Status transition validation
  CONSTRAINT valid_status_transition CHECK (
    (status = 'pending' AND started_at IS NULL AND ended_at IS NULL AND winner_id IS NULL) OR
    (status = 'active' AND started_at IS NOT NULL AND ended_at IS NULL) OR
    (status = 'completed' AND started_at IS NOT NULL AND ended_at IS NOT NULL) OR
    (status = 'cancelled' AND ended_at IS NOT NULL) OR
    (status = 'expired' AND ended_at IS NOT NULL)
  )
);

-- Duel participants table: Tracks per-user progress in duels
CREATE TABLE duel_participants (
  duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  screen_time_seconds BIGINT DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  is_loser BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (duel_id, user_id),

  -- Validation for screen time
  CONSTRAINT valid_screen_time CHECK (screen_time_seconds >= 0),

  -- Validation for streak days
  CONSTRAINT valid_streak_days CHECK (streak_days >= 0)
);

-- Duel rewards table: Stores rewards earned from duels
CREATE TABLE duel_rewards (
  duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type reward_type NOT NULL,
  reward_data JSONB DEFAULT '{}'::jsonb,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (duel_id, user_id, reward_type)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Improve query performance for common access patterns
CREATE INDEX idx_duels_creator_id ON duels(creator_id);
CREATE INDEX idx_duels_opponent_id ON duels(opponent_id);
CREATE INDEX idx_duels_status ON duels(status);
CREATE INDEX idx_duels_created_at ON duels(created_at DESC);
CREATE INDEX idx_duels_duel_type ON duels(duel_type);
CREATE INDEX idx_duels_winner_id ON duels(winner_id);

CREATE INDEX idx_duel_participants_user_id ON duel_participants(user_id);
CREATE INDEX idx_duel_participants_duel_id ON duel_participants(duel_id);
CREATE INDEX idx_duel_participants_screen_time ON duel_participants(screen_time_seconds DESC);

CREATE INDEX idx_duel_rewards_user_id ON duel_rewards(user_id);
CREATE INDEX idx_duel_rewards_duel_id ON duel_rewards(duel_id);
CREATE INDEX idx_duel_rewards_reward_type ON duel_rewards(reward_type);
CREATE INDEX idx_duel_rewards_awarded_at ON duel_rewards(awarded_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_rewards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DUELS TABLE RLS POLICIES
-- =====================================================

-- Users can only view duels they're part of (as creator or opponent)
CREATE POLICY "Users can view duels they're part of" ON duels
  FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    opponent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM duel_participants
      WHERE duel_participants.duel_id = duels.id
      AND duel_participants.user_id = auth.uid()
    )
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
-- DUEL PARTICIPANTS TABLE RLS POLICIES
-- =====================================================

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
-- DUEL REWARDS TABLE RLS POLICIES
-- =====================================================

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
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_duels_updated_at
  BEFORE UPDATE ON duels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_duel_participants_updated_at
  BEFORE UPDATE ON duel_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get active duels for a user
CREATE OR REPLACE FUNCTION get_user_active_duels(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  creator_id UUID,
  opponent_id UUID,
  duel_type duel_type,
  status duel_status,
  duration_hours INTEGER,
  started_at TIMESTAMPTZ,
  winner_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.creator_id,
    d.opponent_id,
    d.duel_type,
    d.status,
    d.duration_hours,
    d.started_at,
    d.winner_id,
    d.created_at
  FROM duels d
  WHERE d.status = 'active'
    AND (d.creator_id = user_uuid OR d.opponent_id = user_uuid)
  ORDER BY d.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get duel leaderboard
CREATE OR REPLACE FUNCTION get_duel_leaderboard(duel_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  screen_time_seconds BIGINT,
  streak_days INTEGER,
  is_loser BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.user_id,
    u.username,
    dp.screen_time_seconds,
    dp.streak_days,
    dp.is_loser
  FROM duel_participants dp
  JOIN users u ON u.id = dp.user_id
  WHERE dp.duel_id = duel_uuid
  ORDER BY dp.screen_time_seconds DESC, dp.streak_days DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('duels', 'duel_participants', 'duel_rewards')
ORDER BY table_name, ordinal_position;

-- Verify RLS policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL AS has_using,
  with_check IS NOT NULL AS has_with_check
FROM pg_policies
WHERE tablename IN ('duels', 'duel_participants', 'duel_rewards')
ORDER BY tablename, policyname;

-- Verify indexes were created
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('duels', 'duel_participants', 'duel_rewards')
ORDER BY tablename, indexname;

-- Verify enums were created
SELECT
  typname AS enum_name,
  enumlabel AS enum_value
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname IN ('duel_type', 'duel_status', 'reward_type')
ORDER BY typname, enumsortorder;
