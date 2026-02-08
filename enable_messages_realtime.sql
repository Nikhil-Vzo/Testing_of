-- Enable Real-Time for Messages Table
-- ============================================

-- Safely add table to publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- Drop and recreate policies to ensure correct permissions without "IF NOT EXISTS" syntax
DROP POLICY IF EXISTS "Users can view messages from their matches" ON messages;
CREATE POLICY "Users can view messages from their matches"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
      AND (matches.user_a = auth.uid() OR matches.user_b = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can send messages to their matches" ON messages;
CREATE POLICY "Users can send messages to their matches"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
      AND (matches.user_a = auth.uid() OR matches.user_b = auth.uid())
  )
);
