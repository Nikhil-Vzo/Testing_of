-- 1. Critical for 'is_read' updates to fire realtime events
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 2. Ensure RLS allows the updates (if you haven't already)
-- We use DO blocks to avoid errors if policies already exist, 
-- or we can just try to create it and separate it. 
-- For simplicity in this script, we'll just run the creation. 
-- If it exists, it might error, but the important part is the REPLICA IDENTITY.

DROP POLICY IF EXISTS "Users can update their own received messages" ON messages;

CREATE POLICY "Users can update their own received messages"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user_a = auth.uid() OR matches.user_b = auth.uid())
  )
);

NOTIFY pgrst, 'reload schema';
