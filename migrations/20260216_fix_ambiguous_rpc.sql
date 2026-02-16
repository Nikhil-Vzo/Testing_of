-- Fix for PGRST203: Could not choose the best candidate function
-- This error happens when there are multiple functions with the same name but different parameters.

-- 1. Drop ALL variations of the function relative to what we typically use
-- We drop strictly by signature to be safe.
DROP FUNCTION IF EXISTS get_potential_matches(uuid);
DROP FUNCTION IF EXISTS get_potential_matches(uuid, text);
DROP FUNCTION IF EXISTS get_potential_matches(uuid, text, int);
DROP FUNCTION IF EXISTS get_potential_matches(uuid, text, int, int);

-- 2. Recreate the function with the definitive signature
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
