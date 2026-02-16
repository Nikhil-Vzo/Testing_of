-- Function to get skipped profiles for second chance mode
-- Returns profiles that the user has PASSED on, ordered by oldest pass first.
-- UPDATED: Added filtering by match_mode (Campus/Global) with fuzzy university matching.

DROP FUNCTION IF EXISTS get_skipped_profiles(uuid);
DROP FUNCTION IF EXISTS get_skipped_profiles(uuid, text, text);

CREATE OR REPLACE FUNCTION get_skipped_profiles(
  current_user_id UUID,
  match_mode TEXT, -- 'campus' or 'global'
  user_university TEXT
)
RETURNS TABLE (
  id uuid,
  anonymous_id text,
  real_name text,
  gender text,
  university text,
  branch text,
  year text,
  interests text[],
  bio text,
  dob text,
  is_verified boolean,
  avatar text,
  looking_for text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.anonymous_id,
    p.real_name,
    p.gender,
    p.university,
    p.branch,
    p.year,
    p.interests,
    p.bio,
    p.dob,
    p.is_verified,
    p.avatar,
    p.looking_for
  FROM profiles p
  INNER JOIN swipes s ON p.id = s.target_id
  WHERE s.liker_id = current_user_id
  AND s.action = 'pass'
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
  ORDER BY s.created_at ASC -- Oldest passes first
  LIMIT 20;
END;
$$;
