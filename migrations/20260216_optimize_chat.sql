-- Optimizing Chat Performance
-- Date: 2026-02-16

-- Index for fetching messages by match_id (used in Chat.tsx)
-- This covers: .eq('match_id', matchId).order('created_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_messages_match_created 
ON public.messages (match_id, created_at DESC);

-- Index for fetching matches (used in Matches.tsx)
-- optimized for OR query with covering index
DROP INDEX IF EXISTS idx_matches_user_a;
DROP INDEX IF EXISTS idx_matches_user_b;

CREATE INDEX IF NOT EXISTS idx_matches_user_a ON public.matches (user_a) INCLUDE (user_b, created_at);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON public.matches (user_b) INCLUDE (user_a, created_at);
