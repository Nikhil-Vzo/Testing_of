-- 1. Safely drop the old policies first
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- 2. Create the UPDATE policy (Fixes "Mark as Read")
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 3. Create the DELETE policy (Fixes "Clear" / "Accept")
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- 4. Force a schema refresh
NOTIFY pgrst, 'reload schema';
