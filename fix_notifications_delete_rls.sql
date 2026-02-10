-- ==========================================
-- Fix: Add DELETE Policy for Notifications
-- Description: Allow users to delete their own notifications (e.g. when accepting/ignoring match requests)
-- ==========================================

-- 1. Policy: Allow users to DELETE their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Reload Schema Cache
NOTIFY pgrst, 'reload config';
