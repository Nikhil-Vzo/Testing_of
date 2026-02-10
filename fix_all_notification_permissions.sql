-- ==========================================
-- MASTER FIX: ALL Notification Permissions
-- Description: Consolidates all necessary RLS policies for notifications.
-- RUN THIS FILE TO FIX ALL PERMISSION ISSUES.
-- ==========================================

-- 1. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. INSERT Policy (For Welcome & Match Logic)
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. SELECT Policy (For Viewing Notifications)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- 4. UPDATE Policy (For "Mark as Read")
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- 5. DELETE Policy (For Accept/Ignore Actions)
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- 6. Reload Schema Cache
NOTIFY pgrst, 'reload config';
