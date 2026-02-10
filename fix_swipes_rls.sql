-- ==========================================
-- Fix: RLS Policy for Swipes Table
-- Description: Allow users to insert their own swipes and view them.
-- Error was: new row violates row-level security policy for table "swipes"
-- ==========================================

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow users to INSERT their own swipes
DROP POLICY IF EXISTS "Users can insert their own swipes" ON public.swipes;
CREATE POLICY "Users can insert their own swipes"
ON public.swipes
FOR INSERT
WITH CHECK (auth.uid() = liker_id);

-- 3. Policy: Allow users to SELECT their own swipes (to check if they already swiped)
DROP POLICY IF EXISTS "Users can view their own swipes" ON public.swipes;
CREATE POLICY "Users can view their own swipes"
ON public.swipes
FOR SELECT
USING (auth.uid() = liker_id);

-- 4. Policy: Allow users to UPDATE their own swipes (e.g. changing pass to like? usually not allowing this but for upsert it might be needed)
-- The code uses UPSERT (onConflict), which requires UPDATE permission if a row exists.
DROP POLICY IF EXISTS "Users can update their own swipes" ON public.swipes;
CREATE POLICY "Users can update their own swipes"
ON public.swipes
FOR UPDATE
USING (auth.uid() = liker_id);

-- 5. Reload Schema Cache
NOTIFY pgrst, 'reload config';
