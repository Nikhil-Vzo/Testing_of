-- ==========================================
-- Fix: Add Missing Foreign Key for Notifications
-- Description: The frontend expects a specific FK name 'notifications_from_user_id_fkey'
-- ==========================================

-- 1. Ensure the column exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'from_user_id') THEN
        ALTER TABLE public.notifications ADD COLUMN from_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Add the specific Foreign Key constraint expected by the frontend
-- We drop it first to ensure we can recreate it with the correct name if it exists with a different name or configuration.
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_from_user_id_fkey;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_from_user_id_fkey
FOREIGN KEY (from_user_id)
REFERENCES public.profiles (id)
ON DELETE CASCADE;

-- 3. Reload Schema Cache (Not strictly SQL, but standard practice is to notify PostgREST)
NOTIFY pgrst, 'reload config';
