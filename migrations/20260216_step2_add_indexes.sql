-- STEP 2: Run this AFTER the column is added
-- Removed the profiles(created_at) index since that column likely doesn't exist
CREATE INDEX IF NOT EXISTS idx_swipes_liker_action_created ON swipes(liker_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_swipes_liker_target ON swipes(liker_id, target_id);
