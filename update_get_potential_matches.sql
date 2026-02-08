-- Function to get potential matches with optional recycling of passed profiles
CREATE OR REPLACE FUNCTION get_potential_matches_v2(
  user_id uuid,
  recycle_mode boolean DEFAULT false,
  query_limit integer DEFAULT 20
)
RETURNS SETOF profiles AS $$
BEGIN
  IF recycle_mode THEN
    -- RECYCLE MODE: Return profiles that were PASSED, but NOT MATCHED/LIKED
    -- This brings back people you swiped left on, but excludes people you swiped right on.
    RETURN QUERY
    SELECT p.*
    FROM profiles p
    WHERE p.id != user_id
    AND p.id NOT IN (
      -- Exclude people I have LIKED (matches or pending likes)
      SELECT target_id FROM swipes WHERE liker_id = user_id AND action = 'like'
    )
    AND p.id IN (
       -- Must be in the "passed" list? 
       -- Or just "not liked"?
       -- If I "passed", it is in swipes with action='pass'.
       -- If I never swiped, it should have been caught by normal mode.
       -- But Normal Mode might be empty if I swiped on everyone.
       -- So here we want: Anyone I passed OR anyone I haven't swiped (if any left, though normal mode would catch them).
       -- Let's just say: Exclude Likes. Include Passes.
       SELECT target_id FROM swipes WHERE liker_id = user_id AND action = 'pass'
    )
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
