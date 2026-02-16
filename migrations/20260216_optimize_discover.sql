-- Create an index on swipes to speed up exclusion checks
CREATE INDEX IF NOT EXISTS idx_swipes_liker_target ON swipes(liker_id, target_id);
CREATE INDEX IF NOT EXISTS idx_swipes_liker ON swipes(liker_id);

-- Create index on profiles for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_university ON profiles(university);

-- Create indexes on blocked_users
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocked_users(blocked_id);

-- Redefine the get_potential_matches function with optimization
CREATE OR REPLACE FUNCTION get_potential_matches(
  user_id UUID,
  filter_university TEXT DEFAULT NULL,
  limit_count INT DEFAULT 50,
  offset_count INT DEFAULT 0
)
RETURNS SETOF profiles
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM profiles p
  WHERE p.id != user_id
    -- Exclude users already swiped by this user
    AND NOT EXISTS (
      SELECT 1 FROM swipes s 
      WHERE s.liker_id = get_potential_matches.user_id 
      AND s.target_id = p.id
    )
    -- Exclude users blocked by this user
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users b 
      WHERE b.blocker_id = get_potential_matches.user_id 
      AND b.blocked_id = p.id
    )
    -- Exclude users who blocked this user
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users b 
      WHERE b.blocker_id = p.id 
      AND b.blocked_id = get_potential_matches.user_id
    )
    -- Optional University Filter
    AND (filter_university IS NULL OR p.university = filter_university)
  ORDER BY random()
  LIMIT limit_count;
END;
$$;
