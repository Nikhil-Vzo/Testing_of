-- Improve Discovery Filtering with Fuzzy Matching
-- Fixes issue where "Amity" and "Amity University" were treated as different in Global mode.

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
    -- MODE FILTERING (Fuzzy Matching)
    AND (
        (match_mode = 'campus' AND (
            LOWER(p.university) = LOWER(user_university) 
            OR LOWER(p.university) LIKE '%' || LOWER(user_university) || '%'
            OR LOWER(user_university) LIKE '%' || LOWER(p.university) || '%'
        ))
        OR
        (match_mode = 'global' AND (
            LOWER(p.university) != LOWER(user_university) 
            AND NOT (LOWER(p.university) LIKE '%' || LOWER(user_university) || '%')
            AND NOT (LOWER(user_university) LIKE '%' || LOWER(p.university) || '%')
        ))
    )
  ORDER BY random()
  LIMIT limit_count;
END;
$$;
