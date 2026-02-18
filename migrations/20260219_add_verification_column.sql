-- Ensure is_verified column exists on profiles table
-- Safe to run multiple times (idempotent)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Optional: index for fast filtering of verified users
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles (is_verified);

-- To verify a user, run from Supabase SQL editor:
-- UPDATE profiles SET is_verified = TRUE WHERE id = '<user-uuid>';

-- To unverify a user:
-- UPDATE profiles SET is_verified = FALSE WHERE id = '<user-uuid>';
