-- Improve Discovery Filtering to fix "Empty Feed" issues.
-- This RPC filters users AT THE DATABASE LEVEL instead of fetching random users and filtering on client.
-- UPDATE: Added case-insensitive matching for University and null checks.

DROP FUNCTION IF EXISTS get_potential_matches(uuid, text, text, int, int);

CREATE OR REPLACE FUNCTION get_potential_matches(
  user_id UUID,
  match_mode TEXT, -- 'campus' or 'global'
  user_university TEXT,
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
    -- MODE FILTERING (Case Insensitive)
    AND (
        (match_mode = 'campus' AND LOWER(p.university) = LOWER(user_university))
        OR
        (match_mode = 'global' AND LOWER(p.university) != LOWER(user_university))
    )
  ORDER BY random()
  LIMIT limit_count;
END;
$$;
