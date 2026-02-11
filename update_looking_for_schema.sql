-- Add looking_for column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'looking_for') THEN
        ALTER TABLE profiles ADD COLUMN looking_for text[];
    END IF;
END $$;

-- Update the matching function to prioritize shared intents
CREATE OR REPLACE FUNCTION get_potential_matches_v2(
  user_id uuid,
  recycle_mode boolean DEFAULT false,
  query_limit integer DEFAULT 20
)
RETURNS SETOF profiles AS $$
DECLARE
  user_looking_for text[];
BEGIN
  -- Get the current user's "looking for" preferences
  SELECT looking_for INTO user_looking_for FROM profiles WHERE id = user_id;

  IF recycle_mode THEN
    -- RECYCLE MODE: Return ANYONE NOT LIKED (Likely to retry/second chance)
    RETURN QUERY
    SELECT p.*
    FROM profiles p
    WHERE p.id != user_id
    AND p.id NOT IN (
      SELECT target_id FROM swipes WHERE liker_id = user_id AND action = 'like'
    )
    AND p.id NOT IN (
      SELECT CASE WHEN user_a = user_id THEN user_b ELSE user_a END
      FROM matches
      WHERE user_a = user_id OR user_b = user_id
    )
    -- Order by overlap count (descending), then random
    ORDER BY
        (
            SELECT COUNT(*)
            FROM unnest(p.looking_for) as target_intent
            WHERE target_intent = ANY(user_looking_for)
        ) DESC,
        random()
    LIMIT query_limit;
  ELSE
    -- NORMAL MODE: New profiles only
    RETURN QUERY
    SELECT p.*
    FROM profiles p
    WHERE p.id != user_id
    AND p.id NOT IN (
      SELECT target_id FROM swipes WHERE liker_id = user_id
    )
    -- Order by overlap count (descending), then random
    ORDER BY
        (
            SELECT COUNT(*)
            FROM unnest(p.looking_for) as target_intent
            WHERE target_intent = ANY(user_looking_for)
        ) DESC,
        random()
    LIMIT query_limit;
  END IF;
END;
$$ LANGUAGE plpgsql;
