-- Migration: Call Notification & Presence System
-- Created: 2026-02-08
-- Description: Adds user presence tracking and call session management

-- ============================================
-- 1. USER PRESENCE TABLE
-- ============================================
-- Tracks online/offline status for real-time presence indicators
CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_online boolean DEFAULT false,
  last_seen timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_user_presence_updated ON user_presence(updated_at);

-- Enable real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Row Level Security (RLS)
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Users can read their own presence and presence of their matches
CREATE POLICY "Users can view presence of matched users"
ON user_presence FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM matches
    WHERE (user_a = auth.uid() AND user_b = user_id)
       OR (user_b = auth.uid() AND user_a = user_id)
  )
);

-- Users can update only their own presence
CREATE POLICY "Users can update own presence"
ON user_presence FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence"
ON user_presence FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. CALL SESSIONS TABLE
-- ============================================
-- Manages call state and signaling between users
CREATE TYPE call_status AS ENUM ('ringing', 'active', 'ended', 'rejected', 'missed');

CREATE TABLE IF NOT EXISTS call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  channel_name text NOT NULL,
  token text NOT NULL,
  app_id text NOT NULL,
  status call_status DEFAULT 'ringing',
  created_at timestamp with time zone DEFAULT now(),
  answered_at timestamp with time zone,
  ended_at timestamp with time zone,
  
  -- Constraints
  CONSTRAINT different_users CHECK (caller_id != receiver_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller ON call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_receiver ON call_sessions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_created ON call_sessions(created_at DESC);

-- Enable real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;

-- Row Level Security (RLS)
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view call sessions where they are caller or receiver
CREATE POLICY "Users can view their own call sessions"
ON call_sessions FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Only caller can create call sessions
CREATE POLICY "Callers can create call sessions"
ON call_sessions FOR INSERT
WITH CHECK (auth.uid() = caller_id);

-- Both caller and receiver can update call sessions
CREATE POLICY "Users can update their call sessions"
ON call_sessions FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_presence
CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-timeout missed calls (after 30 seconds)
CREATE OR REPLACE FUNCTION timeout_missed_calls()
RETURNS void AS $$
BEGIN
  UPDATE call_sessions
  SET status = 'missed',
      ended_at = now()
  WHERE status = 'ringing'
    AND created_at < now() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. SEED DATA (Optional)
-- ============================================
-- Initialize presence for existing users (all offline initially)
INSERT INTO user_presence (user_id, is_online, last_seen)
SELECT id, false, now()
FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- To rollback this migration:
-- DROP TABLE IF EXISTS call_sessions CASCADE;
-- DROP TABLE IF EXISTS user_presence CASCADE;
-- DROP TYPE IF EXISTS call_status;
-- DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
-- DROP FUNCTION IF EXISTS timeout_missed_calls CASCADE;
