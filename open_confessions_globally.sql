-- Migration: Open Confessions Globally
-- Description: Allow all authenticated users to view all confessions regardless of university.

-- 1. Confessions Table
-- Remove potential old policies that restricted access by university
DROP POLICY IF EXISTS "Users can view confessions from their university" ON public.confessions;
DROP POLICY IF EXISTS "View confessions from same university" ON public.confessions;

-- Create a new policy allowing ALL authenticated users to view ALL confessions
CREATE POLICY "Authenticated users can view all confessions"
ON public.confessions FOR SELECT
TO authenticated
USING (true);

-- 2. Profiles Table (Ensure university info is visible)
-- We need to ensure that when fetching a confession, we can also fetch the author's university.
-- Usually, profiles are public, but just in case, we ensure a read policy exists.
-- Note: If a policy "Public profiles are viewable by everyone" already exists, this is fine.
-- We use 'IF NOT EXISTS' logic by checking system catalogs, or just standard creation which might error if duplicate name.
-- For a raw SQL script, we can just try to create it, or the user can skip if conflicts.
-- Simple 'True' policy for profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Public profiles are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END
$$;
