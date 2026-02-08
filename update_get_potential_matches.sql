-- Function to get potential matches with optional recycling of passed profiles
CREATE OR REPLACE FUNCTION get_potential_matches_v2(
  user_id uuid,
  recycle_mode boolean DEFAULT false,
  query_limit integer DEFAULT 20
)
RETURNS SETOF profiles AS $$
BEGIN
  IF recycle_mode THEN
    -- RECYCLE MODE: Return ANYONE NOT LIKED (Includes 'pass', 'skip', etc.)
    -- This brings back everyone except your matches/likes.
    RETURN QUERY
    SELECT p.*
    FROM profiles p
    WHERE p.id != user_id
    AND p.id NOT IN (
      -- Exclude people I have LIKED (swipes)
      SELECT target_id FROM swipes WHERE liker_id = user_id AND action = 'like'
    )
    AND p.id NOT IN (
      -- Exclude CONFIRMED MATCHES (people I am already chatting with)
      SELECT CASE WHEN user_a = user_id THEN user_b ELSE user_a END
      FROM matches
      WHERE user_a = user_id OR user_b = user_id
    )
    -- Broadened: Return ANYONE not liked (Includes passes, skips, etc.)
    -- Randomize to keep it fresh
    ORDER BY random()
    LIMIT query_limit;
  ELSE
    -- NORMAL MODE: New profiles only (Never swiped)
    RETURN QUERY
    SELECT p.*
    FROM profiles p
    WHERE p.id != user_id
    AND p.id NOT IN (
      -- Exclude anyone I have swiped on (like OR pass)
      SELECT target_id FROM swipes WHERE liker_id = user_id
    )
    ORDER BY random()
    LIMIT query_limit;
  END IF;
END;
$$ LANGUAGE plpgsql;
