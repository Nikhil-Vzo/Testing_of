-- ==========================================
-- Fix: RLS Policy for Notifications Table
-- Description: Allow users to insert their own notifications (e.g. Welcome message) and view/update them.
-- ==========================================

-- 1. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow users to INSERT their own notifications
-- This is needed for the frontend "Welcome" notification logic in Onboarding.tsx
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Policy: Allow users to SELECT their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Policy: Allow users to UPDATE their own notifications (e.g. mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Reload Schema Cache
NOTIFY pgrst, 'reload config';
