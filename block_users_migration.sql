-- Block User Functionality Migration
-- Run this after the call notification migration

-- 1. Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CONSTRAINT different_users CHECK (blocker_id != blocked_id)
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- 3. Enable Row Level Security
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view blocks they created" ON blocked_users;
DROP POLICY IF EXISTS "Users can create blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can delete their blocks" ON blocked_users;

-- Users can view blocks they created
CREATE POLICY "Users can view blocks they created"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can create blocks"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their blocks (unblock)
CREATE POLICY "Users can delete their blocks"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- 5. Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE blocked_users;

-- 6. Add helpful functions
-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(
  p_blocker_id uuid,
  p_blocked_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocker_id = p_blocker_id
    AND blocked_id = p_blocked_id
  );
$$;
