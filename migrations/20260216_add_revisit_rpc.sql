-- Function to get skipped profiles for second chance mode
-- Returns profiles that the user has PASSED on, ordered by oldest pass first.

-- DROP first to allow changing return type
DROP FUNCTION IF EXISTS get_skipped_profiles(uuid);

create or replace function get_skipped_profiles(current_user_id uuid)
returns table (
  id uuid,
  anonymous_id text,
  real_name text,
  gender text,
  university text,
  branch text,
  year text,
  interests text[],
  bio text,
  dob text, -- CHANGED FROM DATE TO TEXT to match schema
  is_verified boolean,
  avatar text,
  looking_for text[]
)
language plpgsql
security definer
as $$
begin
  return query
  select
    p.id,
    p.anonymous_id,
    p.real_name,
    p.gender,
    p.university,
    p.branch,
    p.year,
    p.interests,
    p.bio,
    p.dob, -- Ensure this column is actually text in your profiles table
    p.is_verified,
    p.avatar,
    p.looking_for
  from profiles p
  inner join swipes s on p.id = s.target_id
  where s.liker_id = current_user_id
  and s.action = 'pass'
  order by s.created_at asc -- Oldest passes first
  limit 20;
end;
$$;
